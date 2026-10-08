import{i as e}from"./preload-helper-D2yxXLVK.js";import{b as t,t as n,x as r}from"./ledger-DQwEcTus.js";import{a as i,c as a,i as o,n as s,o as c,r as l}from"./ledgerSetupWizardStoryUtils-DjTBC9Gs.js";async function u(e){let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:`下一步`}))}var d,f,p,m,h,g,_;e((()=>{n(),a(),l(),{userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p={title:`Organisms/Ledgers/LedgerSetupBasicInfoStep`,component:c,decorators:i,args:{actions:{...s(null),submitBasicInfo:async e=>e},...o,progress:null},parameters:{viewport:{defaultViewport:`mobile2`}}},m={name:`默认`},h={name:`校验错误`,args:{actions:{...s(null),submitBasicInfo:async()=>({error:r[t.nameRequired],errorKey:`storybook-error`})}},play:async({canvasElement:e})=>{await u(e)}},g={name:`提交中`,args:{actions:{...s(null),submitBasicInfo:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{await u(e)}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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