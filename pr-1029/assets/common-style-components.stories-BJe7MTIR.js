import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-C_MqbCH8.js";import{n as i,t as a}from"./SegmentTabs-_VC49S-d.js";import{l as o}from"./user-BLoxMKBL.js";import{n as s,t as c}from"./userThemeTokens-YIpWi7nb.js";import{n as l,r as u}from"./userThemeCssVariables-C8TQsSFi.js";import{F as d,I as f}from"./iframe-9rwGfNrM.js";import{n as p,t as m}from"./Stack-BknIK93v.js";import{n as h,t as g}from"./SectionCard-B2VUwW02.js";import{n as _,t as v}from"./EmptyState-3u-EO1xB.js";import{n as y,t as b}from"./AccountBalanceWalletRounded-B-KjPZ-N.js";import{n as x,t as S}from"./ReceiptLongRounded-3yJbMunG.js";import{n as C,t as w}from"./IconBadge-4bGy36rE.js";function T(){return(0,O.jsx)(E,{themeKey:`amberWarmth`,children:(0,O.jsx)(D,{})})}function E({children:e,themeKey:t}){return(0,O.jsxs)(p,{spacing:2,style:l(t),sx:{background:`var(--user-theme-page-bg)`,borderRadius:3,color:`var(--user-theme-balance-text)`,maxWidth:520,p:2},children:[(0,O.jsx)(n,{sx:{fontWeight:900},children:s[t].name}),e]})}function D(){return(0,O.jsx)(p,{spacing:2,children:(0,O.jsx)(g,{children:(0,O.jsxs)(p,{spacing:1.5,children:[(0,O.jsxs)(p,{direction:`row`,spacing:1.5,sx:{alignItems:`center`},children:[(0,O.jsx)(w,{label:`账户图标`,children:(0,O.jsx)(b,{fontSize:`small`})}),(0,O.jsxs)(p,{spacing:.25,children:[(0,O.jsx)(n,{sx:{fontWeight:900},children:`共通信息卡片`}),(0,O.jsx)(n,{color:`textSecondary`,variant:`body2`,children:`使用 KuraNote token 的卡片、图标底座和文字层级。`})]})]}),(0,O.jsx)(a,{ariaLabel:`统计期间`,items:k,value:`month`,onChange:()=>void 0})]})})})}var O,k,A,j,M,N,P;e((()=>{O=t(),y(),x(),d(),m(),r(),C(),u(),c(),_(),h(),i(),k=[{label:`日`,value:`day`},{label:`月`,value:`month`},{label:`年`,value:`year`}],A={title:`Molecules/UI/CommonStyleComponents`,component:T},j={name:`默认组件组合`,render:()=>(0,O.jsx)(T,{})},M={name:`空状态`,render:()=>(0,O.jsx)(E,{themeKey:`amberWarmth`,children:(0,O.jsx)(v,{title:`还没有记录`,description:`开始记录第一笔家庭生活账。`,illustration:(0,O.jsx)(w,{label:`空状态图标`,size:`lg`,children:(0,O.jsx)(S,{})}),action:(0,O.jsx)(f,{variant:`contained`,children:`新增记录`})})})},N={name:`6 款主题展示`,render:()=>(0,O.jsx)(p,{spacing:2,children:o.map(e=>(0,O.jsx)(E,{themeKey:e,children:(0,O.jsx)(D,{})},e))})},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "默认组件组合",
  render: () => <CommonStyleComponentsPreview />
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  render: () => <ThemePreview themeKey="amberWarmth">
      <EmptyState title="还没有记录" description="开始记录第一笔家庭生活账。" illustration={<IconBadge label="空状态图标" size="lg">
            <ReceiptLongRoundedIcon />
          </IconBadge>} action={<Button variant="contained">新增记录</Button>} />
    </ThemePreview>
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "6 款主题展示",
  render: () => <Stack spacing={2}>
      {userThemeKeys.map(themeKey => <ThemePreview key={themeKey} themeKey={themeKey}>
          <ComponentGallery />
        </ThemePreview>)}
    </Stack>
}`,...N.parameters?.docs?.source}}},P=[`Default`,`Empty`,`SixThemes`]}))();export{j as Default,M as Empty,N as SixThemes,P as __namedExportsOrder,A as default};