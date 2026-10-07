import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-DuunJNYJ.js";import{n as i,t as a}from"./ConfirmDialogProvider-nU6v5phE.js";import{n as o,t as s}from"./LedgerSetupWizard-CAJMpu7k.js";function c(e={}){return{setup:{baseCurrency:`JPY`,displayColor:`amber`,displayName:`淞文`,draft:{accounts:{items:[{name:`现金`,type:`cash`}],skipped:!1},features:{specialStatusEnabled:!1},merchants:{selectedKeys:[],skipped:!1},templateCurrency:`JPY`,templateVersion:1},hasTemplateSelections:!1,id:l,name:`家庭账本`,step:2,...e},template:null}}var l,u=e((()=>{l=`00000000-0000-4000-8000-000000000001`})),d,f,p,m,h,g,_,v,y,b;e((()=>{d=t(),u(),i(),n(),o(),{userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m=c({displayName:`DENG SONGWEN`}),h={title:`Organisms/Ledgers/LedgerSetupWizard`,component:s,decorators:[e=>(0,d.jsx)(r,{children:(0,d.jsx)(a,{children:(0,d.jsx)(e,{})})})],args:{actions:{submitBasicInfo:async()=>({progress:m})},defaults:{baseCurrency:`JPY`,displayColor:`amber`,displayName:`DENG SONGWEN`,ledgerName:`家庭账本`},onClose:()=>{},open:!0,progress:null}},g={name:`移动端（全屏）`,parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`桌面端（居中弹框）`},v={name:`恢复到第 2 步（占位步骤）`,args:{progress:m},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`关闭确认（已创建账本）`,args:{progress:m},parameters:{viewport:{defaultViewport:`mobile2`}},play:async({canvasElement:e})=>{let t=p(e.ownerDocument.body);await f.click(await t.findByRole(`button`,{name:`关闭创建账本向导`}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "移动端（全屏）",
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "桌面端（居中弹框）"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "恢复到第 2 步（占位步骤）",
  args: {
    progress: setupProgress
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b=[`Mobile`,`Desktop`,`PlaceholderStep`,`CloseConfirm`]}))();export{y as CloseConfirm,_ as Desktop,g as Mobile,v as PlaceholderStep,b as __namedExportsOrder,h as default};