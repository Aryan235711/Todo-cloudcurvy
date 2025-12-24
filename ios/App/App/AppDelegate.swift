import UIKit
import Capacitor
import os

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Minimal AppDelegate-driven setup (no UIScene manifest)
        os_log("AppDelegate: didFinishLaunching - setting up UIWindow and Capacitor bridge", type: .info)

        if #available(iOS 13.0, *) {
            os_log("AppDelegate: iOS 13+ — deferring window setup to SceneDelegate", type: .info)
        } else {
            let window = UIWindow(frame: UIScreen.main.bounds)
            window.backgroundColor = .systemBackground
            let bridgeViewController = CAPBridgeViewController()
            bridgeViewController.view.backgroundColor = .systemBackground
            window.rootViewController = bridgeViewController
            self.window = window
            window.makeKeyAndVisible()

            // Diagnostics: log view frames and subviews shortly after launch
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                os_log("AppDelegate: bridge view frame: %{public}@", type: .info, String(describing: bridgeViewController.view.frame))
                os_log("AppDelegate: bridge view subviews count: %d", type: .info, bridgeViewController.view.subviews.count)
                func dumpView(_ v: UIView, indent: String = "") {
                    os_log("AppDelegate: %{public}@view type: %{public}@ frame: %{public}@ hidden:%d alpha:%{public}@", type: .info, indent, String(describing: type(of: v)), String(describing: v.frame), v.isHidden ? 1 : 0, String(describing: v.alpha))
                    for sub in v.subviews {
                        dumpView(sub, indent: indent + "  ")
                    }
                }
                dumpView(bridgeViewController.view)
                // Search recursively for WKWebView
                func findWK(in v: UIView) -> UIView? {
                    if String(describing: type(of: v)).contains("WKWebView") { return v }
                    for sub in v.subviews { if let found = findWK(in: sub) { return found } }
                    return nil
                }
                if let wk = findWK(in: bridgeViewController.view) {
                    os_log("AppDelegate: found WKWebView (recursive) frame: %{public}@ hidden:%d alpha:%{public}@", type: .info, String(describing: wk.frame), wk.isHidden ? 1 : 0, String(describing: wk.alpha))
                } else {
                    os_log("AppDelegate: WKWebView not found in view hierarchy", type: .info)
                }
            }
        }

        return true
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
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
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
