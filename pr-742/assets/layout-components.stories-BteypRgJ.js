import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{l as n,n as r,t as i,u as a}from"./iframe-DTp07Y2J.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-OLBAmaWZ.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{n as f,t as p}from"./Button-BvhFbL6z.js";import{n as m,t as h}from"./IconButton-BvjujjMV.js";import{n as g,t as _}from"./SectionCard-BLVSLN0g.js";import{n as v,t as y}from"./AccountBalanceWalletRounded-DzhLud4y.js";import{n as b,t as x}from"./IconBadge-ARbPd8Vw.js";import{n as S,t as C}from"./Container-6ALDp3Xp.js";import{n as w,t as T}from"./ArrowBackRounded-CxlZpNyn.js";import{n as E,t as D}from"./PageShell-BYUCnjbX.js";import{n as O,t as k}from"./PageHeader-DUjenTmF.js";function A({bottomNavigationOffset:e=!1,children:t,maxWidth:n=`md`}){return(0,j.jsx)(c,{sx:{background:`var(--user-theme-page-bg)`,color:`var(--user-theme-balance-text)`,minHeight:`100dvh`,overflowX:`hidden`},children:(0,j.jsx)(S,{component:`main`,maxWidth:n,sx:{px:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop},py:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop},pb:e?12:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop}},children:(0,j.jsx)(o,{spacing:{xs:3,sm:4},children:t})})})}var j,M=e((()=>{j=t(),l(),C(),s(),r(),A.__docgenInfo={description:``,methods:[],displayName:`PageFrame`,props:{bottomNavigationOffset:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},maxWidth:{required:!1,tsType:{name:`ContainerProps["maxWidth"]`,raw:`ContainerProps["maxWidth"]`},description:``,defaultValue:{value:`"md"`,computed:!1}}}}}));function N({children:e}){return(0,P.jsx)(`div`,{style:n(`amberWarmth`),children:e})}var P,F,I,L,R,z,B,V;e((()=>{P=t(),v(),w(),p(),h(),s(),d(),b(),g(),a(),M(),O(),E(),F={title:`Templates/Layout/CommonLayout`},I={name:`PageFrame + PageHeader`,render:()=>(0,P.jsx)(N,{children:(0,P.jsxs)(A,{children:[(0,P.jsx)(k,{leading:(0,P.jsx)(x,{label:`账户图标`,children:(0,P.jsx)(y,{fontSize:`small`})}),title:`账户`,subtitle:`管理现金、银行账户、信用卡、电子钱包等账户。`,action:(0,P.jsx)(f,{variant:`contained`,children:`新增账户`})}),(0,P.jsx)(_,{children:`页面主要内容区域`})]})})},L={name:`PageShell + PageHeader（既存）`,render:()=>(0,P.jsx)(N,{children:(0,P.jsxs)(D,{children:[(0,P.jsx)(k,{title:`账户`,subtitle:`管理现金、银行账户、信用卡、电子钱包等账户。`,action:(0,P.jsx)(f,{variant:`contained`,children:`新增账户`})}),(0,P.jsx)(_,{children:`页面主要内容区域`})]})})},R={name:`PageHeader`,render:()=>(0,P.jsx)(N,{children:(0,P.jsx)(k,{title:`商家`,subtitle:`管理常用商家、平台、公司和个人。`,action:(0,P.jsx)(f,{variant:`outlined`,children:`导入`})})})},z={name:`PageHeader（紧凑）`,render:()=>(0,P.jsx)(N,{children:(0,P.jsx)(D,{maxWidth:`sm`,children:(0,P.jsx)(k,{action:(0,P.jsx)(f,{size:`small`,children:`新增商家`}),leading:(0,P.jsx)(m,{"aria-label":`返回`,children:(0,P.jsx)(T,{})}),subtitle:`管理常用商家和头像信息`,title:`商家管理`,variant:`compact`})})})},B={name:`PageHeader（ReactNode subtitle）`,render:()=>(0,P.jsx)(N,{children:(0,P.jsx)(k,{title:`统计`,subtitle:(0,P.jsxs)(o,{spacing:.5,children:[(0,P.jsx)(`span`,{children:`当前账本：家庭账本`}),(0,P.jsx)(u,{color:`text.secondary`,variant:`body2`,children:`按月份整理收支、分类和商家，让家庭账本一眼看清。`})]})})})},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "PageFrame + PageHeader",
  render: () => <ThemeStory>
      <PageFrame>
        <PageHeader leading={<IconBadge label="账户图标">
              <AccountBalanceWalletRoundedIcon fontSize="small" />
            </IconBadge>} title="账户" subtitle="管理现金、银行账户、信用卡、电子钱包等账户。" action={<Button variant="contained">新增账户</Button>} />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageFrame>
    </ThemeStory>
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "PageShell + PageHeader（既存）",
  render: () => <ThemeStory>
      <PageShell>
        <PageHeader title="账户" subtitle="管理现金、银行账户、信用卡、电子钱包等账户。" action={<Button variant="contained">新增账户</Button>} />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageShell>
    </ThemeStory>
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "PageHeader",
  render: () => <ThemeStory>
      <PageHeader title="商家" subtitle="管理常用商家、平台、公司和个人。" action={<Button variant="outlined">导入</Button>} />
    </ThemeStory>
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "PageHeader（紧凑）",
  render: () => <ThemeStory>
      <PageShell maxWidth="sm">
        <PageHeader action={<Button size="small">新增商家</Button>} leading={<IconButton aria-label="返回">
              <ArrowBackRoundedIcon />
            </IconButton>} subtitle="管理常用商家和头像信息" title="商家管理" variant="compact" />
      </PageShell>
    </ThemeStory>
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "PageHeader（ReactNode subtitle）",
  render: () => <ThemeStory>
      <PageHeader title="统计" subtitle={<Stack spacing={0.5}>
            <span>当前账本：家庭账本</span>
            <Typography color="text.secondary" variant="body2">
              按月份整理收支、分类和商家，让家庭账本一眼看清。
            </Typography>
          </Stack>} />
    </ThemeStory>
}`,...B.parameters?.docs?.source}}},V=[`FrameWithHeader`,`ShellWithHeader`,`HeaderOnly`,`CompactHeader`,`HeaderWithRichSubtitle`]}))();export{z as CompactHeader,I as FrameWithHeader,R as HeaderOnly,B as HeaderWithRichSubtitle,L as ShellWithHeader,V as __namedExportsOrder,F as default};