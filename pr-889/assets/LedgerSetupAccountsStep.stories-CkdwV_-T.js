import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n,s as r}from"./ledgerSetup-FkC1q1tT.js";import{a as i,i as a,o,s}from"./LedgerSetupAbandonButton-B-6_6lh3.js";import{r as c,t as l}from"./LedgerSetupWizard-COlBJMbU.js";var u,d,f,p,m,h,g,_,v,y;e((()=>{c(),i(),n(),{userEvent:u,within:d}=__STORYBOOK_MODULE_TEST__,f=t({},r),p=t({draft:{...f.setup.draft,accounts:{items:[{name:`现金`,type:`cash`},{name:`三菱UFJ銀行`,templateKey:`三菱UFJ銀行`,type:`bank`},{name:`楽天銀行`,templateKey:`楽天銀行`,type:`bank`},{name:`楽天カード`,templateKey:`楽天カード`,type:`credit_card`},{name:`PayPay`,templateKey:`PayPay`,type:`e_money`},{name:`Suica`,templateKey:`Suica`,type:`e_money`}],skipped:!1}}},r),m={title:`Organisms/Ledgers/LedgerSetupAccountsStep`,component:l,decorators:s,args:{actions:a(f),...o,progress:f},parameters:{viewport:{defaultViewport:`mobile2`}}},h={name:`默认（只有现金）`},g={name:`多个账户（含已取消勾选）`,args:{actions:a(p),progress:p},play:async({canvasElement:e})=>{let t=d(e.ownerDocument.body);await u.click(await t.findByRole(`checkbox`,{name:`楽天銀行`}))}},_={name:`无模板币种`,args:{progress:t({baseCurrency:`USD`})},play:async({canvasElement:e})=>{let t=d(e.ownerDocument.body);await u.click(await t.findByRole(`button`,{name:`添加银行卡`}))}},v={name:`保存中`,args:{actions:{...a(f),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=d(e.ownerDocument.body);await u.click(await t.findByRole(`button`,{name:/^下一步/}))}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "默认（只有现金）"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "多个账户（含已取消勾选）",
  args: {
    actions: createLedgerSetupWizardStoryActions(multipleAccountsProgress),
    progress: multipleAccountsProgress
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("checkbox", {
      name: "楽天銀行"
    }));
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "无模板币种",
  args: {
    progress: createLedgerSetupProgressFixture({
      baseCurrency: "USD"
    })
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "添加银行卡"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(defaultProgress),
      saveDraft: () => new Promise(() => {})
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: /^下一步/
    }));
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`MultipleAccounts`,`WithoutTemplate`,`Saving`]}))();export{h as Default,g as MultipleAccounts,v as Saving,_ as WithoutTemplate,y as __namedExportsOrder,m as default};