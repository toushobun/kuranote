import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{b as n,g as r,l as i,u as a,v as o,x as s,y as c}from"./iframe-C9Qo9swj.js";import{n as l,t as u}from"./Stack-DRbcmy6F.js";import{n as d,t as f}from"./Box-URR3ZS3X.js";import{n as p,t as m}from"./Typography-CwLqrFKa.js";import{n as h,r as g}from"./DynamicMuiThemeProvider-Bzp8Vzey.js";import{n as _,r as v,t as y}from"./TransactionFilterResultSummary-D-CUWM76.js";var b,x,S,C,w,T,E,D,O;e((()=>{b=t(),f(),u(),n(),m(),a(),r(),g(),v(),x={title:`Templates/Transactions/TransactionFilterResultSummary`,component:y,decorators:[e=>(0,b.jsx)(d,{sx:{maxWidth:380},children:(0,b.jsx)(e,{})})]},S={chips:[],hasActiveFilters:!1,label:`筛选结果如下`,onClear:()=>void 0},C={name:`按商家筛选结果`,args:{chips:[`支出`,`日常`,`支付宝`,`2026/07`],hasActiveFilters:!0,label:`按商家显示，筛选结果如下`,onClear:()=>void 0}},w={name:`加载中：含筛选条件`,args:S,render:()=>(0,b.jsx)(_,{chipCount:4,hasActiveFilters:!0})},T={name:`加载中：无筛选条件`,args:S,render:()=>(0,b.jsx)(_,{chipCount:0,hasActiveFilters:!1})},E={name:`6 款主题`,render:e=>(0,b.jsx)(l,{spacing:2,children:o.map(t=>(0,b.jsx)(s,{theme:h(t),children:(0,b.jsxs)(d,{style:i(t),sx:{maxWidth:380},children:[(0,b.jsx)(p,{sx:{mb:.75,fontSize:12,fontWeight:800},children:c[t].name}),(0,b.jsx)(y,{...e})]})},t))}),args:{chips:[`支出`,`日常`,`支付宝`,`2026/07`],hasActiveFilters:!0,label:`按商家显示，筛选结果如下`,onClear:()=>void 0}},D={name:`加载中：6 款主题`,args:S,render:()=>(0,b.jsx)(l,{spacing:2,children:o.map(e=>(0,b.jsx)(s,{theme:h(e),children:(0,b.jsxs)(d,{style:i(e),sx:{maxWidth:380},children:[(0,b.jsx)(p,{sx:{mb:.75,fontSize:12,fontWeight:800},children:c[e].name}),(0,b.jsx)(_,{chipCount:4,hasActiveFilters:!0})]})},e))})},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "按商家筛选结果",
  args: {
    chips: ["支出", "日常", "支付宝", "2026/07"],
    hasActiveFilters: true,
    label: "按商家显示，筛选结果如下",
    onClear: () => undefined
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "加载中：含筛选条件",
  args: placeholderArgs,
  render: () => <TransactionFilterResultSummarySkeleton chipCount={4} hasActiveFilters />
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "加载中：无筛选条件",
  args: placeholderArgs,
  render: () => <TransactionFilterResultSummarySkeleton chipCount={0} hasActiveFilters={false} />
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "6 款主题",
  render: args => <Stack spacing={2}>
      {userThemeKeys.map(themeKey => <ThemeProvider key={themeKey} theme={createDynamicMuiTheme(themeKey)}>
          <Box style={getUserThemeCssVariables(themeKey) as CSSProperties} sx={{
        maxWidth: 380
      }}>
            <Typography sx={{
          mb: 0.75,
          fontSize: 12,
          fontWeight: 800
        }}>
              {userThemeTokens[themeKey].name}
            </Typography>
            <TransactionFilterResultSummary {...args} />
          </Box>
        </ThemeProvider>)}
    </Stack>,
  args: {
    chips: ["支出", "日常", "支付宝", "2026/07"],
    hasActiveFilters: true,
    label: "按商家显示，筛选结果如下",
    onClear: () => undefined
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "加载中：6 款主题",
  args: placeholderArgs,
  render: () => <Stack spacing={2}>
      {userThemeKeys.map(themeKey => <ThemeProvider key={themeKey} theme={createDynamicMuiTheme(themeKey)}>
          <Box style={getUserThemeCssVariables(themeKey) as CSSProperties} sx={{
        maxWidth: 380
      }}>
            <Typography sx={{
          mb: 0.75,
          fontSize: 12,
          fontWeight: 800
        }}>
              {userThemeTokens[themeKey].name}
            </Typography>
            <TransactionFilterResultSummarySkeleton chipCount={4} hasActiveFilters />
          </Box>
        </ThemeProvider>)}
    </Stack>
}`,...D.parameters?.docs?.source}}},O=[`FilteredByMerchant`,`LoadingWithFilters`,`LoadingWithoutFilters`,`AllThemes`,`LoadingAllThemes`]}))();export{E as AllThemes,C as FilteredByMerchant,D as LoadingAllThemes,w as LoadingWithFilters,T as LoadingWithoutFilters,O as __namedExportsOrder,x as default};