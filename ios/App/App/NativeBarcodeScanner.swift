import Foundation
import AVFoundation
import UIKit
import Capacitor

/// Native iOS barcode scanner Capacitor plugin.
///
/// Uses Apple's hardware-accelerated `AVCaptureMetadataOutput` (the same engine
/// the system Camera app uses) instead of decoding barcodes in JavaScript. The
/// camera preview is inserted *behind* the (transparent) WKWebView so the web
/// layer can keep rendering the custom viewfinder overlay on top.
///
/// JS API (see lib/nativeScanner.ts):
///   NativeBarcode.startScan()  -> begins streaming; emits "barcodeScanned" events
///   NativeBarcode.stopScan()   -> stops and restores the opaque webview
///   NativeBarcode.checkPermission() / requestPermission()
@objc(NativeBarcodeScannerPlugin)
public class NativeBarcodeScannerPlugin: CAPPlugin, CAPBridgedPlugin, AVCaptureMetadataOutputObjectsDelegate {
    public let identifier = "NativeBarcodeScannerPlugin"
    public let jsName = "NativeBarcode"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startScan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopScan", returnType: CAPPluginReturnPromise)
    ]

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var cameraContainer: UIView?
    private let sessionQueue = DispatchQueue(label: "no.skaren.app.barcode.session")
    private var lastEmittedAt: TimeInterval = 0
    private var isScanning = false

    // Barcode symbologies relevant to grocery products + common extras.
    private let metadataTypes: [AVMetadataObject.ObjectType] = [
        .ean13, .ean8, .upce, .code128, .code39, .code93, .itf14, .interleaved2of5
    ]

    // MARK: - Permission helpers

    @objc func isSupported(_ call: CAPPluginCall) {
        call.resolve(["supported": true])
    }

    @objc func checkPermission(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        call.resolve(["granted": status == .authorized, "status": statusString(status)])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            call.resolve(["granted": granted, "status": granted ? "granted" : "denied"])
        }
    }

    private func statusString(_ status: AVAuthorizationStatus) -> String {
        switch status {
        case .authorized: return "granted"
        case .denied: return "denied"
        case .restricted: return "restricted"
        case .notDetermined: return "prompt"
        @unknown default: return "prompt"
        }
    }

    // MARK: - Scanning

    @objc func startScan(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status == .notDetermined {
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    self?.beginSession(call)
                } else {
                    call.reject("Camera permission denied")
                }
            }
            return
        }
        guard status == .authorized else {
            call.reject("Camera permission denied")
            return
        }
        beginSession(call)
    }

    private func beginSession(_ call: CAPPluginCall) {
        if isScanning {
            call.resolve()
            return
        }
        isScanning = true

        sessionQueue.async { [weak self] in
            guard let self = self else { return }

            let session = AVCaptureSession()
            session.beginConfiguration()
            // 1080p gives sharp, easily-decodable barcodes; fall back if unsupported.
            if session.canSetSessionPreset(.hd1920x1080) {
                session.sessionPreset = .hd1920x1080
            } else {
                session.sessionPreset = .high
            }

            guard let device = self.bestRearCamera() else {
                self.isScanning = false
                call.reject("No camera available")
                return
            }

            // Continuous autofocus + close-range focus = fast barcode lock.
            self.configureFocus(device)

            do {
                let input = try AVCaptureDeviceInput(device: device)
                guard session.canAddInput(input) else {
                    self.isScanning = false
                    call.reject("Cannot add camera input")
                    return
                }
                session.addInput(input)
            } catch {
                self.isScanning = false
                call.reject("Camera input error: \(error.localizedDescription)")
                return
            }

            let metadataOutput = AVCaptureMetadataOutput()
            guard session.canAddOutput(metadataOutput) else {
                self.isScanning = false
                call.reject("Cannot add metadata output")
                return
            }
            session.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = self.metadataTypes.filter {
                metadataOutput.availableMetadataObjectTypes.contains($0)
            }

            session.commitConfiguration()
            self.captureSession = session

            DispatchQueue.main.async {
                self.attachPreview(session: session)
                self.sessionQueue.async {
                    session.startRunning()
                    DispatchQueue.main.async { call.resolve() }
                }
            }
        }
    }

    private func bestRearCamera() -> AVCaptureDevice? {
        // Prefer the triple/dual camera (better close-up focus), fall back to wide.
        if let triple = AVCaptureDevice.default(.builtInTripleCamera, for: .video, position: .back) {
            return triple
        }
        if let dual = AVCaptureDevice.default(.builtInDualCamera, for: .video, position: .back) {
            return dual
        }
        return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
    }

    private func configureFocus(_ device: AVCaptureDevice) {
        do {
            try device.lockForConfiguration()
            if device.isFocusModeSupported(.continuousAutoFocus) {
                device.focusMode = .continuousAutoFocus
            }
            if device.isAutoFocusRangeRestrictionSupported {
                device.autoFocusRangeRestriction = .near
            }
            if device.isExposureModeSupported(.continuousAutoExposure) {
                device.exposureMode = .continuousAutoExposure
            }
            device.unlockForConfiguration()
        } catch {
            // Non-fatal: scanning still works with default focus.
        }
    }

    private func attachPreview(session: AVCaptureSession) {
        guard let webView = self.webView, let superview = webView.superview else {
            NSLog("[NativeBarcode] attachPreview: no webView/superview")
            return
        }

        let container = UIView(frame: superview.bounds)
        container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        container.backgroundColor = .black

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = container.bounds
        if let connection = preview.connection, connection.isVideoOrientationSupported {
            connection.videoOrientation = .portrait
        }
        container.layer.addSublayer(preview)

        superview.insertSubview(container, belowSubview: webView)

        // Make the webview (and the views above it in the hierarchy) transparent
        // so the camera preview behind it shows through the web-rendered overlay.
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        superview.backgroundColor = .clear
        superview.isOpaque = false

        NSLog("[NativeBarcode] attachPreview: camera inserted below webView (superview=%@)", String(describing: type(of: superview)))

        self.cameraContainer = container
        self.previewLayer = preview
    }

    @objc func stopScan(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.teardown()
            call.resolve()
        }
    }

    private func teardown() {
        isScanning = false

        // Restore the opaque webview.
        if let webView = self.webView {
            webView.isOpaque = true
            webView.backgroundColor = .white
            webView.scrollView.backgroundColor = .white
        }

        previewLayer?.removeFromSuperlayer()
        previewLayer = nil
        cameraContainer?.removeFromSuperview()
        cameraContainer = nil

        let session = self.captureSession
        self.captureSession = nil
        sessionQueue.async {
            session?.stopRunning()
        }
    }

    // MARK: - Detection callback

    public func metadataOutput(_ output: AVCaptureMetadataOutput,
                               didOutput metadataObjects: [AVMetadataObject],
                               from connection: AVCaptureConnection) {
        guard isScanning else { return }
        guard let obj = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = obj.stringValue, !value.isEmpty else { return }

        // Debounce duplicate emissions (the hardware fires rapidly).
        let now = Date().timeIntervalSince1970
        if now - lastEmittedAt < 1.2 { return }
        lastEmittedAt = now

        notifyListeners("barcodeScanned", data: [
            "barcode": value,
            "format": obj.type.rawValue
        ])
    }

    override public func load() {
        // Stop cleanly if the plugin is torn down.
    }

    deinit {
        teardown()
    }
}
