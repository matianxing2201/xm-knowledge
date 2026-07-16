---
title: 代码分割之错误边界与Suspense和命名导出
date: 2022-01-01
tags:
  - React
  - 代码分割
  - Suspense
---

# 代码分割之错误边界与Suspense和命名导出

## 代码分割至错误边界与Suspense

```javascript
const Main = React.lazy(() => import('./main'))

class ErrorBoundary extends React.Component {
	state = {
  	hasError: false
  }

	static getDerivedStateFromError(err) {
    console.log('getDerivedStateFromError err', err)
    return {
    	hasError: true
    }
  }

	componentDidCatch(err, info) {
  	console.log('componentDidCatche err', err);
    console.log('componentDidCatche info', info);
  }

	render() {
  	if(this.state.hasError){
    	return <h1>This is Error Ui</h1>
    }

    return this.props.children
  }
}

//  可以包裹在最外层 ErrorBoundary 会向上冒泡
class App extends React.Component {
  <div>
    <React.Suspense fallback={ <div>Loading...</div> }>
    	<ErrorBoundary>
      	<Main />
      </ErrorBoundary>
    </React.Suspense>
    </div>
}
```

## 命名导出

- lazy 只支持默认导出组件

```javascript
index.jsx;

export class Test1 extends React.Component {
  render() {
    return <h1>Test1</h1>;
  }
}

export class Test2 extends React.Component {
  render() {
    return <h1>Test2</h1>;
  }
}
```

Test1.jsx

```javascript
export { Test1 as default } from "./index";
```

Test2.jsx

```javascript
export { Test2 as default } from "./index";
```

main.jsx

```javascript
const Test1 = React.lazy(() => import("./components/Test1"));
const Test2 = React.lazy(() => import("./components/Test2"));
```
