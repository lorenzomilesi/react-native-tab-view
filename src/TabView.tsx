import * as React from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import TabBar, { Props as TabBarProps } from './TabBar';
import SceneView from './SceneView';
import {
  Layout,
  NavigationState,
  Route,
  SceneRendererProps,
  PagerCommonProps,
} from './types';
import Pager, { Props as ChildProps } from './Pager';

type Props<T extends Route> = PagerCommonProps & {
  onScrollViewRef: (ref: any) => void;
  onScroll: (e: any) => void;
  onEndReached: () => void;
  scrollEnabled?: boolean;
  onRefresh?: () => void;
  refreshing: boolean;
  position?: Animated.Value<number>;
  onIndexChange: (index: number) => void;
  navigationState: NavigationState<T>;
  renderScene: (
    props: SceneRendererProps & {
      route: T;
    }
  ) => React.ReactNode;
  renderLazyPlaceholder: (props: { route: T }) => React.ReactNode;
  renderTabBar: (
    props: SceneRendererProps & {
      navigationState: NavigationState<T>;
    }
  ) => React.ReactNode;
  isLoading?: boolean;
  renderLoaderComponent?: (props: any) => React.ReactNode;
  isError?: boolean;
  renderErrorComponent?: (props: any) => React.ReactNode;
  tabBarPosition: 'top' | 'bottom';
  initialLayout?: { width?: number; height?: number };
  lazy: boolean;
  lazyPreloadDistance: number;
  removeClippedSubviews?: boolean;
  sceneContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  gestureHandlerProps: React.ComponentProps<typeof PanGestureHandler>;
  renderPager: (props: ChildProps<T>) => React.ReactNode;
  renderTopContent?: () => React.ReactNode;
};

type State = {
  layout: Layout;
};

export default class TabView<T extends Route> extends React.Component<
  Props<T>,
  State
> {
  static defaultProps = {
    tabBarPosition: 'top',
    renderTabBar: <P extends Route>(props: TabBarProps<P>) => (
      <TabBar {...props} />
    ),
    renderLazyPlaceholder: () => null,
    keyboardDismissMode: 'auto',
    swipeEnabled: true,
    lazy: false,
    lazyPreloadDistance: 0,
    removeClippedSubviews: false,
    springConfig: {},
    timingConfig: {},
    gestureHandlerProps: {},
    renderPager: (props: ChildProps<any>) => <Pager {...props} />,
  };

  state = {
    layout: { width: 0, height: 0, ...this.props.initialLayout },
  };

  private jumpToIndex = (index: number) => {
    if (index !== this.props.navigationState.index) {
      this.props.onIndexChange(index);
    }
  };

  private handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    if (
      this.state.layout.width === width &&
      this.state.layout.height === height
    ) {
      return;
    }

    this.setState({
      layout: {
        height,
        width,
      },
    });
  };

  render() {
    const {
      position: positionListener,
      onSwipeStart,
      onSwipeEnd,
      navigationState,
      lazy,
      lazyPreloadDistance,
      removeClippedSubviews,
      keyboardDismissMode,
      swipeEnabled,
      swipeVelocityImpact,
      timingConfig,
      springConfig,
      tabBarPosition,
      renderTabBar,
      renderScene,
      renderLazyPlaceholder,
      sceneContainerStyle,
      style,
      gestureHandlerProps,
      springVelocityScale,
      renderPager,
      onScrollViewRef,
      onScroll,
      onRefresh,
      refreshing,
      scrollEnabled,
      renderTopContent,
      renderLoaderComponent,
      renderErrorComponent,
      isLoading,
      isError,
      onEndReached,
    } = this.props;
    const { layout } = this.state;

    return (
      <View onLayout={this.handleLayout} style={[styles.pager, style]}>
        {renderTopContent ? (
          <ScrollView
            ref={ref => {
              if (onScrollViewRef) {
                onScrollViewRef(ref);
              }
            }}
            scrollEnabled={scrollEnabled}
            stickyHeaderIndices={[1]}
            collapsable={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              ((isLoading && renderLoaderComponent) ||
                (isError && renderErrorComponent)) && { flex: 1 }
            }
            onScroll={e => {
              if (onScroll) {
                onScroll(e);
              }

              let paddingToBottom = 10;
              paddingToBottom += e.nativeEvent.layoutMeasurement.height;
              if (
                e.nativeEvent.contentOffset.y >=
                e.nativeEvent.contentSize.height - paddingToBottom
              ) {
                if (onEndReached) {
                  onEndReached();
                }
              }
            }}
            scrollEventThrottle={400}
          >
            {renderTopContent()}
            {renderPager({
              navigationState,
              layout,
              keyboardDismissMode,
              swipeEnabled,
              swipeVelocityImpact,
              timingConfig,
              springConfig,
              onSwipeStart,
              onSwipeEnd,
              onIndexChange: this.jumpToIndex,
              springVelocityScale,
              removeClippedSubviews,
              gestureHandlerProps,
              children: ({
                position,
                render,
                addListener,
                removeListener,
                jumpTo,
              }) => {
                // All of the props here must not change between re-renders
                // This is crucial to optimizing the routes with PureComponent
                const sceneRendererProps = {
                  position,
                  layout,
                  jumpTo,
                };

                return (
                  <>
                    {positionListener ? (
                      <Animated.Code
                        exec={Animated.set(positionListener, position)}
                      />
                    ) : null}
                    {tabBarPosition === 'top' &&
                      renderTabBar({
                        ...sceneRendererProps,
                        navigationState,
                      })}
                    {render(
                      navigationState.routes.map((route, i) => {
                        return (
                          <SceneView
                            {...sceneRendererProps}
                            addListener={addListener}
                            removeListener={removeListener}
                            key={route.key}
                            index={i}
                            lazy={lazy}
                            lazyPreloadDistance={lazyPreloadDistance}
                            navigationState={navigationState}
                            style={sceneContainerStyle}
                          >
                            {({ loading }) =>
                              loading
                                ? renderLazyPlaceholder({ route })
                                : renderScene({
                                    ...sceneRendererProps,
                                    route,
                                  })
                            }
                          </SceneView>
                        );
                      })
                    )}
                    {tabBarPosition === 'bottom' &&
                      renderTabBar({
                        ...sceneRendererProps,
                        navigationState,
                      })}
                  </>
                );
              },
            })}
          </ScrollView>
        ) : (
          <>
            {renderPager({
              navigationState,
              layout,
              keyboardDismissMode,
              swipeEnabled,
              swipeVelocityImpact,
              timingConfig,
              springConfig,
              onSwipeStart,
              onSwipeEnd,
              onIndexChange: this.jumpToIndex,
              springVelocityScale,
              removeClippedSubviews,
              gestureHandlerProps,
              children: ({
                position,
                render,
                addListener,
                removeListener,
                jumpTo,
              }) => {
                // All of the props here must not change between re-renders
                // This is crucial to optimizing the routes with PureComponent
                const sceneRendererProps = {
                  position,
                  layout,
                  jumpTo,
                };

                return (
                  <>
                    {positionListener ? (
                      <Animated.Code
                        exec={Animated.set(positionListener, position)}
                      />
                    ) : null}
                    {tabBarPosition === 'top' &&
                      renderTabBar({
                        ...sceneRendererProps,
                        navigationState,
                      })}
                    {render(
                      navigationState.routes.map((route, i) => {
                        return (
                          <SceneView
                            {...sceneRendererProps}
                            addListener={addListener}
                            removeListener={removeListener}
                            key={route.key}
                            index={i}
                            lazy={lazy}
                            lazyPreloadDistance={lazyPreloadDistance}
                            navigationState={navigationState}
                            style={sceneContainerStyle}
                          >
                            {({ loading }) =>
                              loading
                                ? renderLazyPlaceholder({ route })
                                : renderScene({
                                    ...sceneRendererProps,
                                    route,
                                  })
                            }
                          </SceneView>
                        );
                      })
                    )}
                    {tabBarPosition === 'bottom' &&
                      renderTabBar({
                        ...sceneRendererProps,
                        navigationState,
                      })}
                  </>
                );
              },
            })}
          </>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
});
