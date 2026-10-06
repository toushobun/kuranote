import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{l as n,n as r,t as i,u as a}from"./iframe-RriY8lCy.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-Btbe1Npy.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{r as f,t as p}from"./DataItemCard-Ceq2XNjy.js";import{n as m,t as h}from"./Button-CmZIvK63.js";import{n as g,t as _}from"./IconButton-DgEIThjY.js";import{n as v,t as y}from"./SectionCard-D36cS4EJ.js";import{n as b,t as x}from"./AccountBalanceWalletRounded-DzhLud4y.js";import{n as S,t as C}from"./IconBadge-_GJ2ASqS.js";import{n as w,t as T}from"./CreateButton-BKdvAnFG.js";import{n as E,t as D}from"./PageHeader-GiGpEKPl.js";import{n as O,t as k}from"./Container-6ALDp3Xp.js";import{n as A,t as j}from"./PageShell-DGqK-jZ2.js";import{n as M,t as N}from"./ArrowBackRounded-CxlZpNyn.js";import{n as P,r as F,t as I}from"./SettingsPageLayout-CJfWwpXZ.js";function L({bottomNavigationOffset:e=!1,children:t,maxWidth:n=`md`}){return(0,R.jsx)(c,{sx:{background:`var(--user-theme-page-bg)`,color:`var(--user-theme-balance-text)`,minHeight:`100dvh`,overflowX:`hidden`},children:(0,R.jsx)(O,{component:`main`,maxWidth:n,sx:{px:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop},py:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop},pb:e?12:{xs:i.spacing.page.mobile,sm:i.spacing.page.desktop}},children:(0,R.jsx)(o,{spacing:{xs:3,sm:4},children:t})})})}var R,z=e((()=>{R=t(),l(),k(),s(),r(),L.__docgenInfo={description:``,methods:[],displayName:`PageFrame`,props:{bottomNavigationOffset:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:``},maxWidth:{required:!1,tsType:{name:`ContainerProps["maxWidth"]`,raw:`ContainerProps["maxWidth"]`},description:``,defaultValue:{value:`"md"`,computed:!1}}}}}));function B({children:e}){return(0,V.jsx)(`div`,{style:n(`amberWarmth`),children:e})}var V,H,U,W,G,K,q,J,Y,X;e((()=>{V=t(),b(),M(),h(),_(),s(),d(),w(),f(),S(),v(),a(),z(),E(),A(),P(),H={title:`Templates/Layout/CommonLayout`},U={name:`PageFrame + PageHeader`,render:()=>(0,V.jsx)(B,{children:(0,V.jsxs)(L,{children:[(0,V.jsx)(D,{leading:(0,V.jsx)(C,{label:`账户图标`,children:(0,V.jsx)(x,{fontSize:`small`})}),title:`账户`,subtitle:`管理现金、银行账户、信用卡、电子钱包等账户。`,action:(0,V.jsx)(m,{variant:`contained`,children:`新增账户`})}),(0,V.jsx)(y,{children:`页面主要内容区域`})]})})},W={name:`PageShell + PageHeader（既存）`,render:()=>(0,V.jsx)(B,{children:(0,V.jsxs)(j,{children:[(0,V.jsx)(D,{title:`账户`,subtitle:`管理现金、银行账户、信用卡、电子钱包等账户。`,action:(0,V.jsx)(m,{variant:`contained`,children:`新增账户`})}),(0,V.jsx)(y,{children:`页面主要内容区域`})]})})},G={name:`PageHeader`,render:()=>(0,V.jsx)(B,{children:(0,V.jsx)(D,{title:`商家`,subtitle:`管理常用商家、平台、公司和个人。`,action:(0,V.jsx)(m,{variant:`outlined`,children:`导入`})})})},K={name:`PageHeader（紧凑）`,render:()=>(0,V.jsx)(B,{children:(0,V.jsx)(j,{maxWidth:`sm`,children:(0,V.jsx)(D,{action:(0,V.jsx)(m,{size:`small`,children:`新增商家`}),leading:(0,V.jsx)(g,{"aria-label":`返回`,children:(0,V.jsx)(N,{})}),subtitle:`管理常用商家和头像信息`,title:`商家管理`,variant:`compact`})})})},q={name:`PageHeader（ReactNode subtitle）`,render:()=>(0,V.jsx)(B,{children:(0,V.jsx)(D,{title:`统计`,subtitle:(0,V.jsxs)(o,{spacing:.5,children:[(0,V.jsx)(`span`,{children:`当前账本：家庭账本`}),(0,V.jsx)(u,{color:`text.secondary`,variant:`body2`,children:`按月份整理收支、分类和商家，让家庭账本一眼看清。`})]})})})},J={name:`SettingsPageLayout（二级页面）`,render:()=>(0,V.jsx)(B,{children:(0,V.jsx)(I,{action:(0,V.jsx)(T,{size:`small`,sx:F,children:`新增账户`}),back:{href:`/settings`,label:`返回设置`},subtitle:`整理家里的现金、银行卡、电子钱包和信用卡`,title:`账户管理`,children:(0,V.jsxs)(o,{spacing:.9,children:[(0,V.jsx)(p,{children:(0,V.jsx)(u,{children:`现金`})}),(0,V.jsx)(p,{children:(0,V.jsx)(u,{children:`银行卡`})})]})})})},Y={name:`SettingsPageLayout（一级页面，无返回）`,render:()=>(0,V.jsx)(B,{children:(0,V.jsx)(I,{subtitle:`管理个人信息、主题与应用设置`,title:`我的`,children:(0,V.jsx)(y,{children:`菜单分组区域`})})})},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "PageFrame + PageHeader",
  render: () => <ThemeStory>
      <PageFrame>
        <PageHeader leading={<IconBadge label="账户图标">
              <AccountBalanceWalletRoundedIcon fontSize="small" />
            </IconBadge>} title="账户" subtitle="管理现金、银行账户、信用卡、电子钱包等账户。" action={<Button variant="contained">新增账户</Button>} />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageFrame>
    </ThemeStory>
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "PageShell + PageHeader（既存）",
  render: () => <ThemeStory>
      <PageShell>
        <PageHeader title="账户" subtitle="管理现金、银行账户、信用卡、电子钱包等账户。" action={<Button variant="contained">新增账户</Button>} />
        <SectionCard>页面主要内容区域</SectionCard>
      </PageShell>
    </ThemeStory>
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "PageHeader",
  render: () => <ThemeStory>
      <PageHeader title="商家" subtitle="管理常用商家、平台、公司和个人。" action={<Button variant="outlined">导入</Button>} />
    </ThemeStory>
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "PageHeader（紧凑）",
  render: () => <ThemeStory>
      <PageShell maxWidth="sm">
        <PageHeader action={<Button size="small">新增商家</Button>} leading={<IconButton aria-label="返回">
              <ArrowBackRoundedIcon />
            </IconButton>} subtitle="管理常用商家和头像信息" title="商家管理" variant="compact" />
      </PageShell>
    </ThemeStory>
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "PageHeader（ReactNode subtitle）",
  render: () => <ThemeStory>
      <PageHeader title="统计" subtitle={<Stack spacing={0.5}>
            <span>当前账本：家庭账本</span>
            <Typography color="text.secondary" variant="body2">
              按月份整理收支、分类和商家，让家庭账本一眼看清。
            </Typography>
          </Stack>} />
    </ThemeStory>
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "SettingsPageLayout（二级页面）",
  render: () => <ThemeStory>
      <SettingsPageLayout action={<CreateButton size="small" sx={settingsPageActionButtonSx}>
            新增账户
          </CreateButton>} back={{
      href: "/settings",
      label: "返回设置"
    }} subtitle="整理家里的现金、银行卡、电子钱包和信用卡" title="账户管理">
        <Stack spacing={0.9}>
          <DataItemCard>
            <Typography>现金</Typography>
          </DataItemCard>
          <DataItemCard>
            <Typography>银行卡</Typography>
          </DataItemCard>
        </Stack>
      </SettingsPageLayout>
    </ThemeStory>
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "SettingsPageLayout（一级页面，无返回）",
  render: () => <ThemeStory>
      <SettingsPageLayout subtitle="管理个人信息、主题与应用设置" title="我的">
        <SectionCard>菜单分组区域</SectionCard>
      </SettingsPageLayout>
    </ThemeStory>
}`,...Y.parameters?.docs?.source}}},X=[`FrameWithHeader`,`ShellWithHeader`,`HeaderOnly`,`CompactHeader`,`HeaderWithRichSubtitle`,`SettingsPageWithBack`,`SettingsPageTopLevel`]}))();export{K as CompactHeader,U as FrameWithHeader,G as HeaderOnly,q as HeaderWithRichSubtitle,Y as SettingsPageTopLevel,J as SettingsPageWithBack,W as ShellWithHeader,X as __namedExportsOrder,H as default};