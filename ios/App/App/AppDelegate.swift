import UIKit
import Capacitor
import AVFoundation
import os.log

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    private let camLog = OSLog(subsystem: "no.skaren.app", category: "camera")
    private var didRequestCamera = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Set WebView background to app cream to prevent white flash while remote URL loads
        let cream = UIColor(red: 0.929, green: 0.918, blue: 0.886, alpha: 1.0)
        if let rootVC = window?.rootViewController as? CAPBridgeViewController {
            rootVC.webView?.backgroundColor = cream
            rootVC.webView?.scrollView.backgroundColor = cream
            rootVC.webView?.isOpaque = false
            // Enable iOS swipe-back gesture
            rootVC.webView?.allowsBackForwardNavigationGestures = true
        }

        os_log("didFinishLaunching: camera authStatus=%{public}d",
               log: camLog, type: .info,
               AVCaptureDevice.authorizationStatus(for: .video).rawValue)

        return true
    }

    private func requestCameraAccessOnce() {
        guard !didRequestCamera else { return }
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        os_log("didBecomeActive: camera authStatus=%{public}d", log: camLog, type: .info, status.rawValue)

        guard status == .notDetermined else {
            // Already authorized or denied — the WebView uses the existing
            // decision and the JS layer handles the denied case.
            didRequestCamera = true
            return
        }

        didRequestCamera = true
        // Dispatch to the next runloop tick so the key window is fully attached
        // before the system alert is presented.
        DispatchQueue.main.async { [weak self] in
            AVCaptureDevice.requestAccess(for: .video) { granted in
                os_log("requestAccess completed granted=%{public}d",
                       log: self?.camLog ?? .default, type: .info, granted ? 1 : 0)
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Request camera permission the first time the app becomes *active*.
        // iOS only presents a permission alert to a fully foreground-active app
        // with a key window. Requesting during didFinishLaunching (splash up /
        // app inactive) caused the alert to be deferred until the next
        // foreground, which is why the prompt only appeared after an app-switch.
        requestCameraAccessOnce()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
