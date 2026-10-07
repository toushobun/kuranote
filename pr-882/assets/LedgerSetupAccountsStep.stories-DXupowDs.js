import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-pkgWgDg0.js";import{n as i,t as a}from"./ConfirmDialogProvider-5k1jnKpP.js";import{n as o,r as s,t as c}from"./ledgerSetup-BO2Qm0C6.js";import{n as l,t as u}from"./LedgerSetupWizard-BVBrjDSU.js";function d(e){return{saveDraft:async()=>({progress:e}),submitBasicInfo:async()=>({progress:e})}}var f,p,m,h,g,_,v,y,b,x,S;e((()=>{f=t(),l(),i(),o(),n(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=c({},s),g=c({draft:{...h.setup.draft,accounts:{items:[{name:`现金`,type:`cash`},{name:`三菱UFJ銀行`,templateKey:`三菱UFJ銀行`,type:`bank`},{name:`楽天銀行`,templateKey:`楽天銀行`,type:`bank`},{name:`楽天カード`,templateKey:`楽天カード`,type:`credit_card`},{name:`PayPay`,templateKey:`PayPay`,type:`e_money`},{name:`Suica`,templateKey:`Suica`,type:`e_money`}],skipped:!1}}},s),_={title:`Organisms/Ledgers/LedgerSetupAccountsStep`,component:u,decorators:[e=>(0,f.jsx)(r,{children:(0,f.jsx)(a,{children:(0,f.jsx)(e,{})})})],args:{actions:d(h),defaults:{baseCurrency:`JPY`,displayColor:`amber`,displayName:`DENG SONGWEN`,ledgerName:`家庭账本`},onClose:()=>{},open:!0,progress:h},parameters:{viewport:{defaultViewport:`mobile2`}}},v={name:`默认（只有现金）`},y={name:`多个账户（含已取消勾选）`,args:{actions:d(g),progress:g},play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`checkbox`,{name:`楽天銀行`}))}},b={name:`无模板币种`,args:{progress:c({baseCurrency:`USD`})},play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:`添加银行卡`}))}},x={name:`保存中`,args:{actions:{...d(h),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:/^下一步/}))}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "默认（只有现金）"
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "多个账户（含已取消勾选）",
  args: {
    actions: createActions(multipleAccountsProgress),
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "保存中",
  args: {
    actions: {
      ...createActions(defaultProgress),
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
}`,...x.parameters?.docs?.source}}},S=[`Default`,`MultipleAccounts`,`WithoutTemplate`,`Saving`]}))();export{v as Default,y as MultipleAccounts,x as Saving,b as WithoutTemplate,S as __namedExportsOrder,_ as default};