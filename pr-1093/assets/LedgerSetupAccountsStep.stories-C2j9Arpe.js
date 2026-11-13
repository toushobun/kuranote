import{i as e}from"./preload-helper-D2yxXLVK.js";import{c as t,t as n}from"./ledger-vCOwyEdk.js";import{a as r,c as i,d as a,i as o,s,u as c}from"./LedgerSetupAbandonButton-CoN4O_Xl.js";import{n as l,t as u}from"./LedgerSetupWizard-BkQJeftl.js";var d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{n(),l(),r(),a(),{userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p=t(`jp`),m=c({},p),h=c({draft:{...m.setup.draft,accounts:{items:[{name:`日元现金`,templateKey:`日元现金`,type:`cash`},{name:`三菱UFJ銀行`,templateKey:`三菱UFJ銀行`,type:`bank`},{name:`楽天銀行`,templateKey:`楽天銀行`,type:`bank`},{name:`楽天カード`,templateKey:`楽天カード`,type:`credit_card`},{name:`PayPay`,templateKey:`PayPay`,type:`e_money`},{name:`支付宝`,templateKey:`支付宝`,type:`e_money`}],skipped:!1}}},p),g=c({draft:{...m.setup.draft,accounts:{items:[{name:`人民币现金`,templateKey:`人民币现金`,type:`cash`}],skipped:!1},templateRegion:`cn`},livingRegion:`cn`},t(`cn`)),_={title:`Organisms/Ledgers/LedgerSetupAccountsStep`,component:u,decorators:i,args:{actions:o(m),...s,progress:m},parameters:{viewport:{defaultViewport:`mobile2`}}},v={name:`默认（只勾选生活地区的现金）`},y={name:`多个账户（含另一地区，展开银行卡）`,args:{actions:o(h),progress:h},play:async({canvasElement:e})=>{let[t]=await f(e.ownerDocument.body).findAllByRole(`button`,{name:`银行卡`});await d.click(t)}},b={name:`生活地区为中国`,args:{actions:o(g),progress:g}},x={name:`超过账户上限`,play:async({canvasElement:e})=>{let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:`中国常用账户`}));for(let e of await t.findAllByRole(`checkbox`,{name:/^选择「.+」的全部账户$/}))e.checked||await d.click(e)}},S={name:`纯本地切换步骤`,args:{actions:{...o(m),persistSetup:async()=>({error:`仅在显式保存或完成时写入`})}},play:async({canvasElement:e})=>{let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:/^下一步/}))}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "默认（只勾选生活地区的现金）"
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "多个账户（含另一地区，展开银行卡）",
  args: {
    actions: createLedgerSetupWizardStoryActions(multipleAccountsProgress),
    progress: multipleAccountsProgress
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    const [bank] = await body.findAllByRole("button", {
      name: "银行卡"
    });
    await userEvent.click(bank!);
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "生活地区为中国",
  args: {
    actions: createLedgerSetupWizardStoryActions(chinaProgress),
    progress: chinaProgress
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "超过账户上限",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "中国常用账户"
    }));
    for (const checkbox of await body.findAllByRole("checkbox", {
      name: /^选择「.+」的全部账户$/
    })) {
      if (!(checkbox as HTMLInputElement).checked) {
        await userEvent.click(checkbox);
      }
    }
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "纯本地切换步骤",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(defaultProgress),
      persistSetup: async () => ({
        error: "仅在显式保存或完成时写入"
      })
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
}`,...S.parameters?.docs?.source}}},C=[`Default`,`MultipleAccounts`,`ChinaRegion`,`LimitExceeded`,`LocalStepChange`]}))();export{b as ChinaRegion,v as Default,x as LimitExceeded,S as LocalStepChange,y as MultipleAccounts,C as __namedExportsOrder,_ as default};