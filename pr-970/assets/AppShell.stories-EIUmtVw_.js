import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{C as i,D as a,E as o,H as s,V as c,n as l,r as u,t as d,x as f}from"./iframe-CmCn_xx5.js";import{n as p,t as m}from"./Box-EkLfTx3K.js";import{r as h,t as g}from"./DynamicMuiThemeProvider-CBlA3IvS.js";import{n as _,t as v}from"./ConfirmDialogProvider-ChKHGdkV.js";import{n as y,r as b,t as x}from"./bottomNavigationLayout-BD-uAs5m.js";import{n as S,t as C}from"./Container-3BiXPi-x.js";import{n as w,t as T}from"./BottomNavigationBar-B_8l5nu8.js";function E(){let e=s(),t=(0,D.useRef)(e),n=(0,D.useRef)(null);(0,D.useEffect)(()=>{function e(){n.current=window.location.pathname}return window.addEventListener(`popstate`,e),()=>window.removeEventListener(`popstate`,e)},[]),(0,D.useLayoutEffect)(()=>{if(t.current===e)return;t.current=e;let r=n.current===e;n.current=null,!r&&window.scrollTo({left:0,top:0,behavior:`instant`})},[e])}var D,O=t((()=>{c(),D=e(n())}));function k({canWriteTransactions:e=!0,children:t,themeKey:n,transactionColorScheme:r}){return(0,j.jsx)(d,{initialThemeKey:n,initialTransactionColorScheme:r,children:(0,j.jsx)(g,{children:(0,j.jsx)(v,{children:(0,j.jsx)(A,{canWriteTransactions:e,children:t})})})})}function A({canWriteTransactions:e,children:t}){let{themeKey:n,transactionColorScheme:r}=u();return E(),(0,j.jsxs)(p,{style:o(n,r),sx:{background:`var(--user-theme-page-bg)`,minHeight:`100dvh`,overflowX:`hidden`,pb:x.shellPaddingBottom,position:`relative`,"&::before":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,content:`""`,height:260,opacity:.38,pointerEvents:`none`,position:`fixed`,right:-88,top:-92,width:260,zIndex:0},"&::after":{background:`radial-gradient(circle, var(--user-theme-card-bg) 0%, transparent 70%)`,borderRadius:`50%`,bottom:96,content:`""`,height:220,left:-90,opacity:.25,pointerEvents:`none`,position:`fixed`,width:220,zIndex:0}},children:[(0,j.jsx)(S,{component:`main`,maxWidth:`md`,sx:{position:`relative`,py:4,zIndex:1,[`&:has([${y}])`]:{zIndex:f.dialog}},children:t}),(0,j.jsx)(T,{canWriteTransactions:e})]})}var j,M=t((()=>{j=r(),m(),C(),w(),b(),_(),h(),l(),a(),i(),O(),k.__docgenInfo={description:``,methods:[],displayName:`AppShell`,props:{canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},themeKey:{required:!0,tsType:{name:`UserThemeKey`},description:``},transactionColorScheme:{required:!0,tsType:{name:`TransactionColorScheme`},description:``}}}})),N,P,F,I,L,R,z;t((()=>{N=r(),M(),P={title:`Templates/Protected/AppShell`,component:k,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/dashboard`}}},args:{themeKey:`amberWarmth`,transactionColorScheme:`expense_green_income_red`,children:(0,N.jsx)(`div`,{style:{padding:16},children:`页面内容区域`})}},F={name:`应用外壳（仪表盘）`},I={name:`应用外壳（明细页）`,parameters:{nextjs:{navigation:{pathname:`/transactions`}}}},L={name:`应用外壳（设置页）`,parameters:{nextjs:{navigation:{pathname:`/settings`}}}},R={name:`应用外壳（用户已设置主题）`,args:{themeKey:`lavenderDream`},parameters:{userTheme:{initialThemeKey:`lavenderDream`}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（仪表盘）"
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（明细页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/transactions"
      }
    }
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "应用外壳（设置页）",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/settings"
      }
    }
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}},z=[`Default`,`TransactionsPage`,`SettingsPage`,`UserTheme`]}))();export{F as Default,L as SettingsPage,I as TransactionsPage,R as UserTheme,z as __namedExportsOrder,P as default};