import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,n,o as r,r as i}from"./ledgerSetup-FkC1q1tT.js";import{a,c as o,i as s,n as c,o as l,r as u}from"./ledgerSetupWizardStoryUtils-CBh2dgIp.js";function d(e){return n({draft:{...n().setup.draft,merchants:{selectedKeys:e,skipped:!1}},step:3},r)}var f,p,m,h,g,_,v,y,b,x;e((()=>{o(),u(),i(),{userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m=d(t),h={title:`Organisms/Ledgers/LedgerSetupMerchantsStep`,component:l,decorators:a,args:{actions:c(m),...s,progress:m},parameters:{viewport:{defaultViewport:`mobile2`}}},g={name:`默认（收起）`},_={name:`展开餐饮`,play:async({canvasElement:e})=>{let t=p(e.ownerDocument.body);await f.click(await t.findByRole(`button`,{name:`餐饮`}))}},v={name:`全不选`,args:{progress:d([])}},y={name:`无模板币种`,args:{progress:n({baseCurrency:`USD`,step:3})}},b={name:`保存中`,args:{actions:{...c(m),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=p(e.ownerDocument.body);await f.click(await t.findByRole(`button`,{name:/^下一步/}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "默认（收起）"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "展开餐饮",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "餐饮"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "全不选",
  args: {
    progress: createMerchantsProgress([])
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "无模板币种",
  args: {
    progress: createLedgerSetupProgressFixture({
      baseCurrency: "USD",
      step: 3
    })
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x=[`Default`,`ExpandRestaurant`,`SelectNone`,`WithoutTemplate`,`Saving`]}))();export{g as Default,_ as ExpandRestaurant,b as Saving,v as SelectNone,y as WithoutTemplate,x as __namedExportsOrder,h as default};