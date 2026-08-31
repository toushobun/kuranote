import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{g as i,v as a,y as o}from"./iframe-D9H5oYxw.js";import{n as s,t as c}from"./Stack-DRbcmy6F.js";import{n as l,t as u}from"./Box-58CVG8Qa.js";import{n as d,t as f}from"./Typography-CwLqrFKa.js";import{n as p,r as m,t as h}from"./UserThemeProvider-ZVX_L6gb.js";import{n as g,t as _}from"./TransactionSearchIllustration-DrpHsmI9.js";function v({themeKey:e}){return(0,x.jsx)(h,{storageScope:`storybook-search-illustration-${e}`,children:(0,x.jsx)(y,{themeKey:e,children:(0,x.jsxs)(l,{sx:O,children:[(0,x.jsx)(d,{sx:k,children:o[e].name}),(0,x.jsxs)(s,{direction:`row`,spacing:2,sx:A,children:[(0,x.jsx)(b,{label:`输入关键词`,variant:`guide`}),(0,x.jsx)(b,{label:`无搜索结果`,variant:`empty`})]})]})})})}function y({children:e,themeKey:t}){let{setThemeKey:n}=m();return(0,S.useEffect)(()=>{n(t)},[n,t]),e}function b({label:e,variant:t}){return(0,x.jsxs)(s,{spacing:1,sx:j,children:[(0,x.jsx)(_,{variant:t}),(0,x.jsx)(d,{sx:M,children:e})]})}var x,S,C,w,T,E,D,O,k,A,j,M,N;t((()=>{x=r(),S=e(n()),u(),c(),f(),p(),i(),g(),C={title:`Molecules/Transactions/TransactionSearchIllustration`,component:_,args:{variant:`guide`},decorators:[e=>(0,x.jsx)(h,{storageScope:`storybook-search-illustration-default`,children:(0,x.jsx)(l,{sx:D,children:(0,x.jsx)(e,{})})})]},w={name:`输入关键词引导`,args:{variant:`guide`}},T={name:`无搜索结果`,args:{variant:`empty`}},E={name:`全部主题`,render:()=>(0,x.jsx)(s,{spacing:3,children:a.map(e=>(0,x.jsx)(v,{themeKey:e},e))})},D={bgcolor:`var(--user-theme-tx-page-bg)`,minHeight:`100vh`,p:3},O={bgcolor:`var(--user-theme-card-bg)`,border:`1px solid var(--user-theme-card-border)`,borderRadius:4,p:2},k={color:`var(--user-theme-tx-name)`,fontSize:15,fontWeight:900,mb:1.5},A={alignItems:`center`,flexWrap:`wrap`},j={alignItems:`center`,minWidth:220},M={color:`text.secondary`,fontSize:12,fontWeight:800},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "输入关键词引导",
  args: {
    variant: "guide"
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "无搜索结果",
  args: {
    variant: "empty"
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "全部主题",
  render: () => <Stack spacing={3}>
      {userThemeKeys.map(themeKey => <ThemePreview key={themeKey} themeKey={themeKey} />)}
    </Stack>
}`,...E.parameters?.docs?.source}}},N=[`Guide`,`Empty`,`AllThemes`]}))();export{E as AllThemes,T as Empty,w as Guide,N as __namedExportsOrder,C as default};