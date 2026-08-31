import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./SegmentTabs-CQD7wmf_.js";import{g as i,l as a,u as o,v as s,y as c}from"./iframe-DBlbBJiJ.js";import{n as l,t as u}from"./Stack-DRbcmy6F.js";import{n as d,t as f}from"./Typography-CwLqrFKa.js";import{n as p,t as m}from"./Button-DfoJRk0N.js";import{n as h,t as g}from"./SectionCard-B0RSfjnM.js";import{n as _,t as v}from"./EmptyState-BzBFAGOE.js";import{i as y,n as b,r as x,t as S}from"./IconBadge-BCgfB9Vf.js";import{n as C,t as w}from"./ReceiptLongRounded-B_ij3HiB.js";function T(){return(0,O.jsx)(E,{themeKey:`amberWarmth`,children:(0,O.jsx)(D,{})})}function E({children:e,themeKey:t}){return(0,O.jsxs)(l,{spacing:2,style:a(t),sx:{background:`var(--user-theme-page-bg)`,borderRadius:3,color:`var(--user-theme-balance-text)`,maxWidth:520,p:2},children:[(0,O.jsx)(d,{sx:{fontWeight:900},children:c[t].name}),e]})}function D(){return(0,O.jsx)(l,{spacing:2,children:(0,O.jsx)(g,{children:(0,O.jsxs)(l,{spacing:1.5,children:[(0,O.jsxs)(l,{direction:`row`,spacing:1.5,sx:{alignItems:`center`},children:[(0,O.jsx)(S,{label:`账户图标`,children:(0,O.jsx)(x,{fontSize:`small`})}),(0,O.jsxs)(l,{spacing:.25,children:[(0,O.jsx)(d,{sx:{fontWeight:900},children:`共通信息卡片`}),(0,O.jsx)(d,{color:`text.secondary`,variant:`body2`,children:`使用 KuraNote token 的卡片、图标底座和文字层级。`})]})]}),(0,O.jsx)(r,{ariaLabel:`统计期间`,items:k,value:`month`,onChange:()=>void 0})]})})})}var O,k,A,j,M,N,P;e((()=>{O=t(),y(),C(),m(),u(),f(),b(),o(),i(),_(),h(),n(),k=[{label:`日`,value:`day`},{label:`月`,value:`month`},{label:`年`,value:`year`}],A={title:`Molecules/UI/CommonStyleComponents`,component:T},j={name:`默认组件组合`,render:()=>(0,O.jsx)(T,{})},M={name:`空状态`,render:()=>(0,O.jsx)(E,{themeKey:`amberWarmth`,children:(0,O.jsx)(v,{title:`还没有记录`,description:`开始记录第一笔家庭生活账。`,illustration:(0,O.jsx)(S,{label:`空状态图标`,size:`lg`,children:(0,O.jsx)(w,{})}),action:(0,O.jsx)(p,{variant:`contained`,children:`新增记录`})})})},N={name:`6 款主题展示`,render:()=>(0,O.jsx)(l,{spacing:2,children:s.map(e=>(0,O.jsx)(E,{themeKey:e,children:(0,O.jsx)(D,{})},e))})},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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