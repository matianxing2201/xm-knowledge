---
title: 组合与继承、CSS Module
date: 2026-07-09
tags:
  - React
  - CSS Module
---

# 组合与继承、CSS Module

## 1、组合与继承

- 若 Container 内部有内容，React 会在 porps 内部增加 children 属性。
- 若 Container 内部有非元素内容，children：非元素内容。
- 若 Container 内部有单个元素内容，children：React 元素对象。
- 若 Container 内部有多个元素内容，children：[]。

> 例1 非元素内容
>
> <Container>666</Container>
>
> <img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640591358461-b33be543-a388-4278-a7d8-c1e90917307e.png" width="237" title="" crop="0,0,1,1" id="aKOZ0" class="ne-image">

> 例2 单个元素内容
>
> <Container><h1>666</h1></Container>
>
> <img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640591773990-9153f8c9-a86d-47eb-b6e3-1d824f4f14b9.png" width="652" title="" crop="0,0,1,1" id="ue520d3ec" class="ne-image">

> 例3 多个元素内容
>
> <Container>
>
> <h1>h1</h1>
>
> <h2>h2</h2>
>
> </Container>
>
> <img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640591896344-db995c64-56f1-41cc-b928-95adc45bc9ff.png" width="494" title="" crop="0,0,1,1" id="uefe647d3" class="ne-image">

## 2、props

- JSX 还可以通过 props 传递视图元素
- JSX 本质上都会转成 React 元素（对象 Object）
- 视图通过 props 传递记得机制类似 Vue 的插槽，但 React 没有 slot 的概念定义
- React 本身就允许通过 props 传递任何类型的数据到子组件

## 3、React 样式

- CSS Module
- index.module.css

```javascript
import styles from './index.module.css'  // 变量接收  下面控制设置 css 样式

class Container extends React.Component {
	render() {
  	console.log(this.props)
    return(
    	<div className={ style.container }>
      	<div className={ styles.header }>{ this.props.header }</div>
				<div className={ styles.main }>
        	<div className={ styles.left }>{ this.props.left }</div>
					<div className={ styles.right }>{ this.props.right }</div>
        </div>
      <div>
    )
  }
}

class Header extends React.Component {
    render() {
        return <div>Header</div>
    }
}
class Left extends React.Component {
    render() {
        return <div>Left</div>
    }
}
class Right extends React.Component {
    render() {
        return <div>Right</div>
    }
}

class App extends React.Component {
	render(){
  	return(
    	<div>
      	<Container
      		header={ <Header /> }
  				left={ <Left/> }
					right={ <Right/> }
      	/>
      <div>
    )
  }
}
```

## 4、多层组合

```javascript
import styles from './index.module.css'

// 多层组合
// Modal 共工的部分，定制的内容作为children 传入

function Modal(props) {
	return(
  	<div className={ style.wrap }>
    	<header className={ styles.title }>{ props.title }</header>
			<div className={ styles.main }>
        { props.children }
      </div>
    </div>
  )
}

//props 作为参数传入 不用 this 来访问 props
function Alert(props) {
	return(
  	<div>
    	<Modal title={ props.title }>
    		<p>{ props.text }</p>
    	</Model>
    </div>
  )
}

function LoginModal(props) {
	return(
  	<div>
    	<Modal title={ props.title }>
    		<form>
    			<p>用户名：<input type="text" /></p>
          <p>密码：<input type="password" /></p>
          <p><button>登录</button></p>
    		</form>
    	</Modal>
    </div>
  )
}


ReactDOM.render(
	<div>
  	<Alert
  		text="显示内容"
  		title="标题内容"
  	/>
  	<LoginModal title="登录modal" />
  </div>
)

```
