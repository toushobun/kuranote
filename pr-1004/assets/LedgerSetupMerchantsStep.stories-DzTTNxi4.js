import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,n,t as r}from"./ledger-BGt7TM1w.js";import{n as i,r as a}from"./ledgerSetup-BKkZHDvW.js";import{a as o,i as s,n as c,r as l}from"./ledgerSetupWizardStoryUtils-Drc0cJwt.js";import{n as u,t as d}from"./LedgerSetupWizard-DcM6EIfr.js";function f(e=g.merchants.selectedKeys,t=[]){return i({draft:{...i().setup.draft,merchants:{selectedKeys:e,skipped:!1,additionalRegions:t}},step:3},h)}var p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{u(),l(),a(),r(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=t(`jp`),g=n(`jp`,h),_=f(),v={title:`Organisms/Ledgers/LedgerSetupMerchantsStep`,component:d,decorators:o,args:{actions:c(_),...s,progress:_},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`默认（收起）`},b={name:`展开餐饮`,play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:`餐饮`}))}},x={name:`全不选`,args:{progress:f([])}},S={name:`追加中国`,args:{progress:f(void 0,[`cn`])}},C={name:`部分选中`,args:{progress:f([`apple`,`starbucks`])}},w={name:`人民币账本使用日本地区`,args:{progress:{..._,setup:{..._.setup,baseCurrency:`CNY`}}}},T={name:`保存中`,args:{actions:{...c(_),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:/^下一步/}))}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "默认（收起）"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "展开餐饮",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "餐饮"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "全不选",
  args: {
    progress: createMerchantsProgress([])
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "追加中国",
  args: {
    progress: createMerchantsProgress(undefined, ["cn"])
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    progress: createMerchantsProgress(["apple", "starbucks"])
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "人民币账本使用日本地区",
  args: {
    progress: {
      ...defaultProgress,
      setup: {
        ...defaultProgress.setup,
        baseCurrency: "CNY"
      }
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E=[`Default`,`ExpandRestaurant`,`SelectNone`,`AddedChina`,`Partial`,`DifferentCurrency`,`Saving`]}))();export{S as AddedChina,y as Default,w as DifferentCurrency,b as ExpandRestaurant,C as Partial,T as Saving,x as SelectNone,E as __namedExportsOrder,v as default};