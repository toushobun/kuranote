import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-C2UO3rmv.js";import{n as i,t as a}from"./ConfirmDialogProvider-BntjsL9e.js";import{b as o,t as s,y as c}from"./ledger-BG-sWqL8.js";import{n as l,t as u}from"./LedgerSetupWizard-D3ZC8k2U.js";async function d(e){let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:`下一步`}))}var f,p,m,h,g,_,v,y;e((()=>{f=t(),s(),l(),i(),n(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Ledgers/LedgerSetupBasicInfoStep`,component:u,decorators:[e=>(0,f.jsx)(r,{children:(0,f.jsx)(a,{children:(0,f.jsx)(e,{})})})],args:{actions:{saveDraft:async()=>({}),submitBasicInfo:async e=>e},defaults:{baseCurrency:`JPY`,displayColor:`amber`,displayName:`DENG SONGWEN`,ledgerName:`家庭账本`},onClose:()=>{},open:!0,progress:null},parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`默认`},_={name:`校验错误`,args:{actions:{saveDraft:async()=>({}),submitBasicInfo:async()=>({error:o[c.nameRequired],errorKey:`storybook-error`})}},play:async({canvasElement:e})=>{await d(e)}},v={name:`提交中`,args:{actions:{saveDraft:async()=>({}),submitBasicInfo:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{await d(e)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "默认"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "校验错误",
  args: {
    actions: {
      saveDraft: async () => ({}),
      submitBasicInfo: async () => ({
        error: ledgerCreateErrorMessages[ledgerCreateErrorCodes.nameRequired],
        errorKey: "storybook-error"
      })
    }
  },
  play: async ({
    canvasElement
  }) => {
    await clickNext(canvasElement);
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "提交中",
  args: {
    actions: {
      saveDraft: async () => ({}),
      submitBasicInfo: () => new Promise(() => {})
    }
  },
  play: async ({
    canvasElement
  }) => {
    await clickNext(canvasElement);
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`ValidationError`,`Submitting`]}))();export{g as Default,v as Submitting,_ as ValidationError,y as __namedExportsOrder,h as default};