import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-pkgWgDg0.js";import{n as i,t as a}from"./ConfirmDialogProvider-5k1jnKpP.js";import{n as o,t as s}from"./ledgerSetup-BO2Qm0C6.js";import{n as c,t as l}from"./LedgerSetupWizard-BVBrjDSU.js";var u,d,f,p,m,h,g,_,v,y;e((()=>{u=t(),o(),i(),n(),c(),{userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p=s({displayName:`DENG SONGWEN`}),m={title:`Organisms/Ledgers/LedgerSetupWizard`,component:l,decorators:[e=>(0,u.jsx)(r,{children:(0,u.jsx)(a,{children:(0,u.jsx)(e,{})})})],args:{actions:{saveDraft:async()=>({progress:p}),submitBasicInfo:async()=>({progress:p})},defaults:{baseCurrency:`JPY`,displayColor:`amber`,displayName:`DENG SONGWEN`,ledgerName:`家庭账本`},onClose:()=>{},open:!0,progress:null}},h={name:`移动端（全屏）`,parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`桌面端（居中弹框）`},_={name:`恢复到第 2 步（账户）`,args:{progress:p},parameters:{viewport:{defaultViewport:`mobile2`}}},v={name:`关闭确认（已创建账本）`,args:{progress:p},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:`关闭创建账本向导`}))}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "移动端（全屏）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "桌面端（居中弹框）"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "恢复到第 2 步（账户）",
  args: {
    progress: setupProgress
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y=[`Mobile`,`Desktop`,`ResumeAccountsStep`,`CloseConfirm`]}))();export{v as CloseConfirm,g as Desktop,h as Mobile,_ as ResumeAccountsStep,y as __namedExportsOrder,m as default};