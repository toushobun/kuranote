import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-C_MqbCH8.js";import{l as i}from"./user-BLoxMKBL.js";import{n as a,t as o}from"./userThemeTokens-YIpWi7nb.js";import{R as s,b as c,x as l,z as u}from"./iframe-Cay7rMwY.js";import{n as d,t as f}from"./Stack-BknIK93v.js";import{n as p,t as m}from"./TransactionSearchIllustration-CE4HczEM.js";function h({themeKey:e}){return(0,_.jsx)(c,{initialThemeKey:e,children:(0,_.jsxs)(u,{sx:C,children:[(0,_.jsx)(n,{sx:w,children:a[e].name}),(0,_.jsxs)(d,{direction:`row`,spacing:2,sx:T,children:[(0,_.jsx)(g,{label:`输入关键词`,variant:`guide`}),(0,_.jsx)(g,{label:`无搜索结果`,variant:`empty`})]})]})})}function g({label:e,variant:t}){return(0,_.jsxs)(d,{spacing:1,sx:E,children:[(0,_.jsx)(m,{variant:t}),(0,_.jsx)(n,{sx:D,children:e})]})}var _,v,y,b,x,S,C,w,T,E,D,O;e((()=>{_=t(),s(),f(),r(),l(),o(),p(),v={title:`Molecules/Transactions/TransactionSearchIllustration`,component:m,args:{variant:`guide`},decorators:[e=>(0,_.jsx)(u,{sx:S,children:(0,_.jsx)(e,{})})]},y={name:`输入关键词引导`,args:{variant:`guide`}},b={name:`无搜索结果`,args:{variant:`empty`}},x={name:`全部主题`,render:()=>(0,_.jsx)(d,{spacing:3,children:i.map(e=>(0,_.jsx)(h,{themeKey:e},e))})},S={bgcolor:`var(--user-theme-tx-page-bg)`,minHeight:`100vh`,p:3},C={bgcolor:`var(--user-theme-card-bg)`,border:`1px solid var(--user-theme-card-border)`,borderRadius:4,p:2},w={color:`var(--user-theme-tx-name)`,fontSize:15,fontWeight:900,mb:1.5},T={alignItems:`center`,flexWrap:`wrap`},E={alignItems:`center`,minWidth:220},D={color:`text.secondary`,fontSize:12,fontWeight:800},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "输入关键词引导",
  args: {
    variant: "guide"
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "无搜索结果",
  args: {
    variant: "empty"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "全部主题",
  render: () => <Stack spacing={3}>
      {userThemeKeys.map(themeKey => <ThemePreview key={themeKey} themeKey={themeKey} />)}
    </Stack>
}`,...x.parameters?.docs?.source}}},O=[`Guide`,`Empty`,`AllThemes`]}))();export{x as AllThemes,b as Empty,y as Guide,O as __namedExportsOrder,v as default};