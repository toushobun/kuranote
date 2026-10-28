import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{B as i,T as a,n as o,r as s,t as c,w as l,z as u}from"./iframe-DYC6ct7O.js";import{n as d,t as f}from"./Box-DjuF9EN0.js";import{r as p,t as m}from"./DynamicMuiThemeProvider-Dsz5IOYS.js";import{n as h,t as g}from"./ConfirmDialogProvider-DGi5vkUP.js";import{n as _,t as v}from"./bottomNavigationLayout-ionY5hVx.js";import{n as y,t as b}from"./Container-3BiXPi-x.js";import{n as x,t as S}from"./BottomNavigationBar-B5b2ZE9T.js";function C(){let e=i(),t=(0,w.useRef)(e),n=(0,w.useRef)(null);(0,w.useEffect)(()=>{function e(){n.current=window.location.pathname}return window.addEventListener(`popstate`,e),()=>window.removeEventListener(`popstate`,e)},[]),(0,w.useLayoutEffect)(()=>{if(t.current===e)return;t.current=e;let r=n.current===e;n.current=null,!r&&window.scrollTo({left:0,top:0,behavior:`instant`})},[e])}var w,T=t((()=>{u(),w=e(n())}));function E({canWriteTransactions:e=!0,children:t,themeKey:n,transactionColorScheme:r}){return(0,O.jsx)(c,{initialThemeKey:n,initialTransactionColorScheme:r,children:(0,O.jsx)(m,{children:(0,O.jsx)(g,{children:(0,O.jsx)(D,{canWriteTransactions:e,children:t})})})})}function D({canWriteTransactions:e,children:t}){let{themeKey:n,transactionColorScheme:r}=s();return C(),(0,O.jsxs)(d,{style:l(n,r),sx:{background:`var(--user-theme-page-bg)`,minHeight:`100dvh`,overflowX:`hidden`,pb:v.shellPaddingBottom,position:`relative`,"&::before":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,content:`""`,height:260,opacity:.38,pointerEvents:`none`,position:`fixed`,right:-88,top:-92,width:260,zIndex:0},"&::after":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,bottom:96,content:`""`,height:220,left:-90,opacity:.25,pointerEvents:`none`,position:`fixed`,width:220,zIndex:0}},children:[(0,O.jsx)(y,{component:`main`,maxWidth:`md`,sx:{position:`relative`,py:4,zIndex:1},children:t}),(0,O.jsx)(S,{canWriteTransactions:e})]})}var O,k=t((()=>{O=r(),f(),b(),x(),_(),h(),p(),o(),a(),T(),E.__docgenInfo={description:``,methods:[],displayName:`AppShell`,props:{canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},themeKey:{required:!0,tsType:{name:`UserThemeKey`},description:``},transactionColorScheme:{required:!0,tsType:{name:`TransactionColorScheme`},description:``}}}})),A,j,M,N,P,F,I;t((()=>{A=r(),k(),j={title:`Templates/Protected/AppShell`,component:E,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/dashboard`}}},args:{themeKey:`amberWarmth`,transactionColorScheme:`expense_green_income_red`,children:(0,A.jsx)(`div`,{style:{padding:16},children:`页面内容区域`})}},M={name:`应用外壳（仪表盘）`},N={name:`应用外壳（明细页）`,parameters:{nextjs:{navigation:{pathname:`/transactions`}}}},P={name:`应用外壳（设置页）`,parameters:{nextjs:{navigation:{pathname:`/settings`}}}},F={name:`应用外壳（用户已设置主题）`,args:{themeKey:`lavenderDream`},parameters:{userTheme:{initialThemeKey:`lavenderDream`}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（仪表盘）"
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（明细页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/transactions"
      }
    }
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（设置页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/settings"
      }
    }
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（用户已设置主题）",
  args: {
    themeKey: "lavenderDream"
  },
  // 全局 decorator 的 UserThemeProvider 与 AppShell 内部主题保持一致，避免 <html> 被重置为默认主题。
  parameters: {
    userTheme: {
      initialThemeKey: "lavenderDream"
    }
  }
}`,...F.parameters?.docs?.source}}},I=[`Default`,`TransactionsPage`,`SettingsPage`,`UserTheme`]}))();export{M as Default,P as SettingsPage,N as TransactionsPage,F as UserTheme,I as __namedExportsOrder,j as default};