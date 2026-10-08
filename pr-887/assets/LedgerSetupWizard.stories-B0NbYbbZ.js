import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n}from"./ledgerSetup-FkC1q1tT.js";import{a as r,c as i,i as a,n as o,o as s,r as c}from"./ledgerSetupWizardStoryUtils-DjTBC9Gs.js";var l,u,d,f,p,m,h,g,_;e((()=>{n(),i(),c(),{userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d=t({displayName:`DENG SONGWEN`}),f={title:`Organisms/Ledgers/LedgerSetupWizard`,component:s,decorators:r,args:{actions:o(d),...a,progress:null}},p={name:`移动端（全屏）`,parameters:{viewport:{defaultViewport:`mobile2`}}},m={name:`桌面端（居中弹框）`},h={name:`恢复到第 2 步（账户）`,args:{progress:d},parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`关闭确认（已创建账本）`,args:{progress:d},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{let t=u(e.ownerDocument.body);await l.click(await t.findByRole(`button`,{name:`关闭创建账本向导`}))}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "移动端（全屏）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "桌面端（居中弹框）"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "恢复到第 2 步（账户）",
  args: {
    progress: setupProgress
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_=[`Mobile`,`Desktop`,`ResumeAccountsStep`,`CloseConfirm`]}))();export{g as CloseConfirm,m as Desktop,p as Mobile,h as ResumeAccountsStep,_ as __namedExportsOrder,f as default};