import UIKit
import Capacitor
import os

@objcMembers
@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else {
            os_log("SceneDelegate: received non-UIWindowScene", type: .error)
            return
        }

        os_log("SceneDelegate: willConnectTo", type: .info)
        let window = UIWindow(windowScene: windowScene)

        // Create the Capacitor bridge view controller
        let bridgeViewController = CAPBridgeViewController()
        window.rootViewController = bridgeViewController
        self.window = window
        window.makeKeyAndVisible()

        os_log("SceneDelegate: madeKeyAndVisible rootViewController=%{public}@", type: .info, String(describing: window.rootViewController))
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        os_log("SceneDelegate: didDisconnect", type: .info)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        os_log("SceneDelegate: didBecomeActive", type: .info)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        os_log("SceneDelegate: willResignActive", type: .info)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        os_log("SceneDelegate: willEnterForeground", type: .info)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        os_log("SceneDelegate: didEnterBackground", type: .info)
    }
}
