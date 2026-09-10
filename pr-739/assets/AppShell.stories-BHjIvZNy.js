import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{l as n,u as r}from"./iframe-MujpGnkj.js";import{n as i,t as a}from"./Box-BMVOkPKk.js";import{n as o,r as s,t as c}from"./UserThemeProvider-7ZtwB18g.js";import{r as l,t as u}from"./DynamicMuiThemeProvider-CZajmjX1.js";import{n as d,t as f}from"./ConfirmDialogProvider-UAvywuPC.js";import{n as p,t as m}from"./bottomNavigationLayout-B4ylDe8e.js";import{n as h,t as g}from"./Container-6ALDp3Xp.js";import{n as _,t as v}from"./BottomNavigationBar-DXgN5SCP.js";function y({canWriteTransactions:e=!0,children:t,email:n,transactionColorScheme:r}){return(0,x.jsx)(c,{initialTransactionColorScheme:r,storageScope:n,children:(0,x.jsx)(u,{children:(0,x.jsx)(f,{children:(0,x.jsx)(b,{canWriteTransactions:e,children:t})})})})}function b({canWriteTransactions:e,children:t}){let{themeKey:r,transactionColorScheme:a}=s();return(0,x.jsxs)(i,{style:n(r,a),sx:{minHeight:`100dvh`,overflowX:`hidden`,pb:m.shellPaddingBottom,position:`relative`,"&::before":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,content:`""`,height:260,opacity:.38,pointerEvents:`none`,position:`fixed`,right:-88,top:-92,width:260,zIndex:0},"&::after":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,bottom:96,content:`""`,height:220,left:-90,opacity:.25,pointerEvents:`none`,position:`fixed`,width:220,zIndex:0}},children:[(0,x.jsx)(h,{component:`main`,maxWidth:`md`,sx:{position:`relative`,py:4,zIndex:1},children:t}),(0,x.jsx)(v,{canWriteTransactions:e})]})}var x,S=e((()=>{x=t(),a(),g(),_(),p(),d(),l(),o(),r(),y.__docgenInfo={description:``,methods:[],displayName:`AppShell`,props:{canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},email:{required:!0,tsType:{name:`string`},description:``},transactionColorScheme:{required:!0,tsType:{name:`TransactionColorScheme`},description:``}}}})),C,w,T,E,D,O;e((()=>{C=t(),S(),w={title:`Templates/Protected/AppShell`,component:y,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/dashboard`}}},args:{email:`user@example.com`,transactionColorScheme:`expense_green_income_red`,children:(0,C.jsx)(`div`,{style:{padding:16},children:`页面内容区域`})}},T={name:`应用外壳（仪表盘）`},E={name:`应用外壳（明细页）`,parameters:{nextjs:{navigation:{pathname:`/transactions`}}}},D={name:`应用外壳（设置页）`,parameters:{nextjs:{navigation:{pathname:`/settings`}}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（仪表盘）"
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（明细页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/transactions"
      }
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（设置页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/settings"
      }
    }
  }
}`,...D.parameters?.docs?.source}}},O=[`Default`,`TransactionsPage`,`SettingsPage`]}))();export{T as Default,D as SettingsPage,E as TransactionsPage,O as __namedExportsOrder,w as default};