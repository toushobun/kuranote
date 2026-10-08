import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,n,o as r,r as i}from"./ledgerSetup-FkC1q1tT.js";import{a,c as o,i as s,n as c,o as l,r as u}from"./ledgerSetupWizardStoryUtils-CT_nifmj.js";var d,f,p,m,h,g,_,v,y,b,x;e((()=>{o(),u(),i(),{userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p=n(),m=n({draft:{...p.setup.draft,accounts:{items:[{name:`现金`,type:`cash`},{name:`三菱UFJ銀行`,templateKey:`三菱UFJ銀行`,type:`bank`},{name:`楽天カード`,templateKey:`楽天カード`,type:`credit_card`},{name:`PayPay`,templateKey:`PayPay`,type:`e_money`}],skipped:!1},features:{specialStatusEnabled:!0},merchants:{selectedKeys:[...t,`apple`],skipped:!1}},displayName:`DENG SONGWEN`,step:5},r),h=n({draft:{...p.setup.draft,accounts:{items:[{name:`现金`,type:`cash`}],skipped:!0},merchants:{selectedKeys:[],skipped:!1}},displayName:`DENG SONGWEN`,step:5},r),g={title:`Organisms/Ledgers/LedgerSetupConfirmStep`,component:l,decorators:a,args:{actions:c(m),...s,progress:m},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`全部有内容`},v={name:`分类展开`,play:async({canvasElement:e})=>{let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:`展开全部 12 个分类`}))}},y={name:`账户与商家已跳过`,args:{progress:h}},b={name:`提交中`,args:{actions:{...c(m),completeSetup:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=f(e.ownerDocument.body);await d.click(await t.findByRole(`button`,{name:`完成创建`}))}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "全部有内容"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "分类展开",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "展开全部 12 个分类"
    }));
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "账户与商家已跳过",
  args: {
    progress: skippedProgress
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "提交中",
  args: {
    actions: {
      ...createLedgerSetupWizardStoryActions(filledProgress),
      completeSetup: () => new Promise(() => {})
    }
  },
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "完成创建"
    }));
  }
}`,...b.parameters?.docs?.source}}},x=[`Default`,`CategoriesExpanded`,`Skipped`,`Submitting`]}))();export{v as CategoriesExpanded,_ as Default,y as Skipped,b as Submitting,x as __namedExportsOrder,g as default};