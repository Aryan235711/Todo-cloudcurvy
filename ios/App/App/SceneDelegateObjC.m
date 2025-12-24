#import "SceneDelegateObjC.h"
#import <Capacitor/Capacitor.h>

@implementation SceneDelegate

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
        return;
    }

    UIWindowScene *windowScene = (UIWindowScene *)scene;
    self.window = [[UIWindow alloc] initWithWindowScene:windowScene];

    CAPBridgeViewController *bridge = [[CAPBridgeViewController alloc] init];
    self.window.rootViewController = bridge;
    [self.window makeKeyAndVisible];

    NSLog(@"ObjC SceneDelegate: willConnectTo - created bridge and window");
}

- (void)sceneDidBecomeActive:(UIScene *)scene {
    NSLog(@"ObjC SceneDelegate: didBecomeActive");
}

- (void)sceneDidDisconnect:(UIScene *)scene {
    NSLog(@"ObjC SceneDelegate: didDisconnect");
}

@end
