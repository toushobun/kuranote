import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{l as n,n as r,t as i,u as a}from"./iframe-BsiX9VKK.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-Dt4JKXFo.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{n as f,t as p}from"./Button-BvhFbL6z.js";import{n as m,t as h}from"./SectionCard-B1gqALgz.js";import{i as g,n as _,r as v,t as y}from"./IconBadge-CVIpRXPo.js";import{n as b,t as x}from"./Container-6ALDp3Xp.js";import{n as S,t as C}from"./PageShell-_96lu77g.js";import{n as w,t as T}from"./PageHeader-CZhOlEE3.js";function E({bottomNavigationOffset:e=!1,children:t,maxWidth:n=`md`}){return(0,D.jsx)(c,{sx:{background:`var(--user-theme-page-bg)`,color:`var(--user-theme-balance-text)`,minHeight:`100dvh`,overflowX:`hidden`},children:(0,D.jsx)(b,{component:`main`,maxWidth:n,sx:{px:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop},py:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop},pb:e?12:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop}},children:(0,D.jsx)(o,{spacing:{xs:3,sm:4},children:t})})})}var D,O=e((()=>{D=t(),l(),x(),s(),r(),E.__docgenInfo={description:``,methods:[],displayName:`PageFrame`,props:{bottomNavigationOffset:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},maxWidth:{required:!1,tsType:{name:`ContainerProps["maxWidth"]`,raw:`ContainerProps["maxWidth"]`},description:``,defaultValue:{value:`"md"`,computed:!1}}}}}));function k({children:e}){return(0,A.jsx)(`div`,{style:n(`amberWarmth`),children:e})}var A,j,M,N,P,F,I;e((()=>{A=t(),g(),p(),s(),d(),_(),m(),a(),O(),w(),S(),j={title:`Templates/Layout/CommonLayout`},M={name:`PageFrame + PageHeader`,render:()=>(0,A.jsx)(k,{children:(0,A.jsxs)(E,{children:[(0,A.jsx)(T,{leading:(0,A.jsx)(y,{label:`账户图标`,children:(0,A.jsx)(v,{fontSize:`small`})}),title:`账户`,subtitle:`管理现金、银行账户、信用卡、电子钱包等账户。`,action:(0,A.jsx)(f,{variant:`contained`,children:`新增账户`})}),(0,A.jsx)(h,{children:`页面主要内容区域`})]})})},N={name:`PageShell + PageHeader（既存）`,render:()=>(0,A.jsx)(k,{children:(0,A.jsxs)(C,{children:[(0,A.jsx)(T,{title:`账户`,subtitle:`管理现金、银行账户、信用卡、电子钱包等账户。`,action:(0,A.jsx)(f,{variant:`contained`,children:`新增账户`})}),(0,A.jsx)(h,{children:`页面主要内容区域`})]})})},P={name:`PageHeader`,render:()=>(0,A.jsx)(k,{children:(0,A.jsx)(T,{title:`商家`,subtitle:`管理常用商家、平台、公司和个人。`,action:(0,A.jsx)(f,{variant:`outlined`,children:`导入`})})})},F={name:`PageHeader（ReactNode subtitle）`,render:()=>(0,A.jsx)(k,{children:(0,A.jsx)(T,{title:`统计`,subtitle:(0,A.jsxs)(o,{spacing:.5,children:[(0,A.jsx)(`span`,{children:`当前账本：家庭账本`}),(0,A.jsx)(u,{color:`text.secondary`,variant:`body2`,children:`按月份整理收支、分类和商家，让家庭账本一眼看清。`})]})})})},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "PageFrame + PageHeader",
  render: () => <ThemeStory>
      <PageFrame>
        <PageHeader leading={<IconBadge label="账户图标">
              <AccountBalanceWalletRoundedIcon fontSize="small" />
            </IconBadge>} title="账户" subtitle="管理现金、银行账户、信用卡、电子钱包等账户。" action={<Button variant="contained">新增账户</Button>} />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageFrame>
    </ThemeStory>
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "PageShell + PageHeader（既存）",
  render: () => <ThemeStory>
      <PageShell>
        <PageHeader title="账户" subtitle="管理现金、银行账户、信用卡、电子钱包等账户。" action={<Button variant="contained">新增账户</Button>} />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageShell>
    </ThemeStory>
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "PageHeader",
  render: () => <ThemeStory>
      <PageHeader title="商家" subtitle="管理常用商家、平台、公司和个人。" action={<Button variant="outlined">导入</Button>} />
    </ThemeStory>
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "PageHeader（ReactNode subtitle）",
  render: () => <ThemeStory>
      <PageHeader title="统计" subtitle={<Stack spacing={0.5}>
            <span>当前账本：家庭账本</span>
            <Typography color="text.secondary" variant="body2">
              按月份整理收支、分类和商家，让家庭账本一眼看清。
            </Typography>
          </Stack>} />
    </ThemeStory>
}`,...F.parameters?.docs?.source}}},I=[`FrameWithHeader`,`ShellWithHeader`,`HeaderOnly`,`HeaderWithRichSubtitle`]}))();export{M as FrameWithHeader,P as HeaderOnly,F as HeaderWithRichSubtitle,N as ShellWithHeader,I as __namedExportsOrder,j as default};