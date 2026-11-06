import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,n,t as r}from"./ledger-BGt7TM1w.js";import{n as i,r as a}from"./ledgerSetup-BKkZHDvW.js";import{a as o,i as s,n as c,r as l}from"./ledgerSetupWizardStoryUtils-PhvXjzJx.js";import{n as u,t as d}from"./LedgerSetupWizard-nWIkFQh1.js";function f(e=`jp`,r){let a=t(e),o=n(e,a);return i({livingRegion:e,draft:{...i().setup.draft,merchants:{selectedKeys:r??o.merchants.selectedKeys,skipped:!1}},step:3},a)}var p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{u(),l(),a(),r(),{userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h=f(),g={title:`Organisms/Ledgers/LedgerSetupMerchantsStep`,component:d,decorators:o,args:{actions:c(h),...s,progress:h},parameters:{viewport:{defaultViewport:`mobile2`}}},_={name:`默认（收起）`},v={name:`展开购物`,play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:`购物`}))}},y={name:`全不选`,args:{progress:f(`jp`,[])}},b={name:`中国优先`,args:{progress:f(`cn`)}},x={name:`展开中国`,play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:/中国常用商家/}))}},S={name:`部分选中`,args:{progress:f(`jp`,h.setup.draft.merchants.selectedKeys.filter(e=>e!==`apple`))}},C={name:`人民币账本使用日本地区`,args:{progress:{...h,setup:{...h.setup,baseCurrency:`CNY`}}}},w={name:`保存中`,args:{actions:{...c(h),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=m(e.ownerDocument.body);await p.click(await t.findByRole(`button`,{name:/^下一步/}))}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "默认（收起）"
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "展开购物",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "购物"
    }));
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "全不选",
  args: {
    progress: createMerchantsProgress("jp", [])
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "中国优先",
  args: {
    progress: createMerchantsProgress("cn")
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "展开中国",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: /中国常用商家/
    }));
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    progress: createMerchantsProgress("jp", defaultProgress.setup.draft.merchants.selectedKeys.filter(key => key !== "apple"))
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}},T=[`Default`,`ExpandShopping`,`SelectNone`,`ChinaFirst`,`AddedChina`,`Partial`,`DifferentCurrency`,`Saving`]}))();export{x as AddedChina,b as ChinaFirst,_ as Default,C as DifferentCurrency,v as ExpandShopping,S as Partial,w as Saving,y as SelectNone,T as __namedExportsOrder,g as default};