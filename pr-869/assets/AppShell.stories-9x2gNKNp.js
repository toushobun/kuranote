import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{l as n,u as r}from"./iframe-RriY8lCy.js";import{n as i,t as a}from"./Box-Btbe1Npy.js";import{n as o,r as s,t as c}from"./UserThemeProvider-CPySeIPd.js";import{r as l,t as u}from"./DynamicMuiThemeProvider-nM81nfJG.js";import{n as d,t as f}from"./ConfirmDialogProvider-DazK7oaA.js";import{n as p,t as m}from"./bottomNavigationLayout-D_SN6_7U.js";import{n as h,t as g}from"./Container-6ALDp3Xp.js";import{n as _,t as v}from"./BottomNavigationBar-oVaRN701.js";function y({canWriteTransactions:e=!0,children:t,themeKey:n,transactionColorScheme:r}){return(0,x.jsx)(c,{initialThemeKey:n,initialTransactionColorScheme:r,children:(0,x.jsx)(u,{children:(0,x.jsx)(f,{children:(0,x.jsx)(b,{canWriteTransactions:e,children:t})})})})}function b({canWriteTransactions:e,children:t}){let{themeKey:r,transactionColorScheme:a}=s();return(0,x.jsxs)(i,{style:n(r,a),sx:{background:`var(--user-theme-page-bg)`,minHeight:`100dvh`,overflowX:`hidden`,pb:m.shellPaddingBottom,position:`relative`,"&::before":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,content:`""`,height:260,opacity:.38,pointerEvents:`none`,position:`fixed`,right:-88,top:-92,width:260,zIndex:0},"&::after":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,bottom:96,content:`""`,height:220,left:-90,opacity:.25,pointerEvents:`none`,position:`fixed`,width:220,zIndex:0}},children:[(0,x.jsx)(h,{component:`main`,maxWidth:`md`,sx:{position:`relative`,py:4,zIndex:1},children:t}),(0,x.jsx)(v,{canWriteTransactions:e})]})}var x,S=e((()=>{x=t(),a(),g(),_(),p(),d(),l(),o(),r(),y.__docgenInfo={description:``,methods:[],displayName:`AppShell`,props:{canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},themeKey:{required:!0,tsType:{name:`UserThemeKey`},description:``},transactionColorScheme:{required:!0,tsType:{name:`TransactionColorScheme`},description:``}}}})),C,w,T,E,D,O,k;e((()=>{C=t(),S(),w={title:`Templates/Protected/AppShell`,component:y,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/dashboard`}}},args:{themeKey:`amberWarmth`,transactionColorScheme:`expense_green_income_red`,children:(0,C.jsx)(`div`,{style:{padding:16},children:`页面内容区域`})}},T={name:`应用外壳（仪表盘）`},E={name:`应用外壳（明细页）`,parameters:{nextjs:{navigation:{pathname:`/transactions`}}}},D={name:`应用外壳（设置页）`,parameters:{nextjs:{navigation:{pathname:`/settings`}}}},O={name:`应用外壳（用户已设置主题）`,args:{themeKey:`lavenderDream`}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（用户已设置主题）",
  args: {
    themeKey: "lavenderDream"
  }
}`,...O.parameters?.docs?.source}}},k=[`Default`,`TransactionsPage`,`SettingsPage`,`UserTheme`]}))();export{T as Default,D as SettingsPage,E as TransactionsPage,O as UserTheme,k as __namedExportsOrder,w as default};