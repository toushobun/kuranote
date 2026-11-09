import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,c as n,d as r,i,o as a,s as o,u as s}from"./LedgerSetupAbandonButton-FOapu5vA.js";import{n as c,t as l}from"./LedgerSetupWizard-Dg43CDv_.js";var u,d,f,p,m,h,g,_,v,y,b,x;e((()=>{r(),c(),t(),{userEvent:u,within:d}=__STORYBOOK_MODULE_TEST__,f=s({displayName:`DENG SONGWEN`}),p={title:`Organisms/Ledgers/LedgerSetupWizard`,component:l,decorators:n,args:{actions:i(f),...o,progress:null}},m={name:`移动端（全屏）`,parameters:{viewport:{defaultViewport:`mobile2`}}},h={name:`桌面端（居中弹框）`},g={name:`恢复到第 2 步（账户）`,args:{progress:f},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`关闭确认（已创建账本）`,args:{progress:f},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{let t=d(e.ownerDocument.body);await u.click(await t.findByRole(`button`,{name:`关闭创建账本向导`}))}},v={name:`已有草稿提示`,args:{progress:a,initialNotice:`draft`}},y={name:`关闭确认（有本地修改，三个等宽按钮）`,parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{let t=d(e.ownerDocument.body),n=await t.findByRole(`textbox`,{name:`账本名称`});await u.clear(n),await u.type(n,`未保存的旅行账本`),await u.click(await t.findByRole(`button`,{name:`关闭创建账本向导`}))}},b={name:`保存并退出失败（草稿保留）`,args:{progress:f,actions:{...i(f),persistSetup:async()=>({error:`保存失败，请稍后再试。当前草稿仍留在此页面。`})}},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{let t=d(e.ownerDocument.body);await u.click(await t.findByRole(`button`,{name:`关闭创建账本向导`})),await u.click(await t.findByRole(`button`,{name:`保存并退出`}))}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "移动端（全屏）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "桌面端（居中弹框）"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "恢复到第 2 步（账户）",
  args: {
    progress: setupProgress
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "关闭确认（已创建账本）",
  args: {
    progress: setupProgress
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "关闭创建账本向导"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "已有草稿提示",
  args: {
    progress: ledgerSetupRestartStoryProgress,
    initialNotice: "draft"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "关闭确认（有本地修改，三个等宽按钮）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    const field = await body.findByRole("textbox", {
      name: "账本名称"
    });
    await userEvent.clear(field);
    await userEvent.type(field, "未保存的旅行账本");
    await userEvent.click(await body.findByRole("button", {
      name: "关闭创建账本向导"
    }));
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "保存并退出失败（草稿保留）",
  args: {
    progress: setupProgress,
    actions: {
      ...createLedgerSetupWizardStoryActions(setupProgress),
      persistSetup: async () => ({
        error: "保存失败，请稍后再试。当前草稿仍留在此页面。"
      })
    }
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "关闭创建账本向导"
    }));
    await userEvent.click(await body.findByRole("button", {
      name: "保存并退出"
    }));
  }
}`,...b.parameters?.docs?.source}}},x=[`Mobile`,`Desktop`,`ResumeAccountsStep`,`CloseConfirm`,`ExistingDraft`,`CloseConfirmWithChanges`,`SaveFailure`]}))();export{_ as CloseConfirm,y as CloseConfirmWithChanges,h as Desktop,v as ExistingDraft,m as Mobile,g as ResumeAccountsStep,b as SaveFailure,x as __namedExportsOrder,p as default};