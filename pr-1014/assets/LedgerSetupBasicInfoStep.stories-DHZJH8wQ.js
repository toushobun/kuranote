import{i as e}from"./preload-helper-D2yxXLVK.js";import{T as t,t as n,w as r}from"./ledger-JoiThs6z.js";import{a as i,c as a,i as o,s}from"./LedgerSetupAbandonButton-CW0_3po2.js";import{n as c,t as l}from"./LedgerSetupWizard-CDZYX1pj.js";async function u(e){let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:`下一步`}))}var d,f,p,m,h,g,_;e((()=>{n(),c(),i(),{userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p={title:`Organisms/Ledgers/LedgerSetupBasicInfoStep`,component:l,decorators:a,args:{actions:{...o(null),submitBasicInfo:async e=>e},...s,progress:null},parameters:{viewport:{defaultViewport:`mobile2`}}},m={name:`默认`},h={name:`校验错误`,args:{actions:{...o(null),submitBasicInfo:async()=>({error:t[r.nameRequired],errorKey:`storybook-error`})}},play:async({canvasElement:e})=>{await u(e)}},g={name:`提交中`,args:{actions:{...o(null),submitBasicInfo:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{await u(e)}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "默认"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "校验错误",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(null),
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
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "提交中",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(null),
      submitBasicInfo: () => new Promise(() => {})
    }
  },
  play: async ({
    canvasElement
  }) => {
    await clickNext(canvasElement);
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`ValidationError`,`Submitting`]}))();export{m as Default,g as Submitting,h as ValidationError,_ as __namedExportsOrder,p as default};