import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{l as n,u as r}from"./iframe-GLFCBZQ7.js";import{n as i,t as a}from"./Box-CBfcvc_O.js";import{n as o,r as s,t as c}from"./UserThemeProvider-uoInEzno.js";import{n as l,t as u}from"./bottomNavigationLayout-U0HAUtXs.js";import{n as d,t as f}from"./Container-6ALDp3Xp.js";import{n as p,t as m}from"./BottomNavigationBar-8Apa72LV.js";import{r as h,t as g}from"./DynamicMuiThemeProvider-BHkbPMiW.js";function _({canWriteTransactions:e=!0,children:t,email:n,transactionColorScheme:r}){return(0,y.jsx)(c,{initialTransactionColorScheme:r,storageScope:n,children:(0,y.jsx)(g,{children:(0,y.jsx)(v,{canWriteTransactions:e,children:t})})})}function v({canWriteTransactions:e,children:t}){let{themeKey:r,transactionColorScheme:a}=s();return(0,y.jsxs)(i,{style:n(r,a),sx:{minHeight:`100dvh`,overflowX:`hidden`,pb:u.shellPaddingBottom,position:`relative`,"&::before":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,content:`""`,height:260,opacity:.38,pointerEvents:`none`,position:`fixed`,right:-88,top:-92,width:260,zIndex:0},"&::after":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,bottom:96,content:`""`,height:220,left:-90,opacity:.25,pointerEvents:`none`,position:`fixed`,width:220,zIndex:0}},children:[(0,y.jsx)(d,{component:`main`,maxWidth:`md`,sx:{position:`relative`,py:4,zIndex:1},children:t}),(0,y.jsx)(m,{canWriteTransactions:e})]})}var y,b=e((()=>{y=t(),a(),f(),p(),l(),h(),o(),r(),_.__docgenInfo={description:``,methods:[],displayName:`AppShell`,props:{canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},email:{required:!0,tsType:{name:`string`},description:``},transactionColorScheme:{required:!0,tsType:{name:`TransactionColorScheme`},description:``}}}})),x,S,C,w,T,E;e((()=>{x=t(),b(),S={title:`Templates/Protected/AppShell`,component:_,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/dashboard`}}},args:{email:`user@example.com`,transactionColorScheme:`expense_green_income_red`,children:(0,x.jsx)(`div`,{style:{padding:16},children:`页面内容区域`})}},C={name:`应用外壳（仪表盘）`},w={name:`应用外壳（明细页）`,parameters:{nextjs:{navigation:{pathname:`/transactions`}}}},T={name:`应用外壳（设置页）`,parameters:{nextjs:{navigation:{pathname:`/settings`}}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（仪表盘）"
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（明细页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/transactions"
      }
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（设置页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/settings"
      }
    }
  }
}`,...T.parameters?.docs?.source}}},E=[`Default`,`TransactionsPage`,`SettingsPage`]}))();export{C as Default,T as SettingsPage,w as TransactionsPage,E as __namedExportsOrder,S as default};