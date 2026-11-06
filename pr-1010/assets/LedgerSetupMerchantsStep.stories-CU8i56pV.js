import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,n,t as r}from"./ledger-D7Hfnv6L.js";import{n as i,r as a}from"./ledgerSetup-BKkZHDvW.js";import{a as o,i as s,n as c,r as l}from"./ledgerSetupWizardStoryUtils-DjhhagpA.js";import{n as u,t as d}from"./LedgerSetupWizard-B39ZaBDM.js";import{n as f,r as p}from"./merchantPresetSelectorTestUtils-C90Gy5Dv.js";function m(e=`jp`,r){let a=t(e),o=n(e,a);return i({livingRegion:e,draft:{...i().setup.draft,merchants:{selectedKeys:r??o.merchants.selectedKeys,skipped:!1}},step:3},a)}var h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{u(),l(),a(),f(),r(),{userEvent:h,within:g}=__STORYBOOK_MODULE_TEST__,_=m(),v={title:`Organisms/Ledgers/LedgerSetupMerchantsStep`,component:d,decorators:o,args:{actions:c(_),...s,progress:_},parameters:{viewport:{defaultViewport:`mobile2`}}},y={name:`日本优先（默认展开）`},b={name:`展开购物·订阅`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,{name:`购物·订阅`}))}},x={name:`全不选`,args:{progress:m(`jp`,[])}},S={name:`中国优先`,args:{progress:m(`cn`)}},C={name:`日本收起、中国餐饮展开`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,p(`jp`))),await h.click(await t.findByRole(`button`,p(`cn`))),await h.click(await t.findByRole(`button`,{name:`餐饮`,expanded:!1})),await h.click(await t.findByRole(`checkbox`,{name:/海底捞/}))}},w={name:`两组都收起`,play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,p(`jp`)))}},T={name:`部分选中`,args:{progress:m(`jp`,_.setup.draft.merchants.selectedKeys.filter(e=>e!==`apple`))}},E={name:`人民币账本使用日本地区`,args:{progress:{..._,setup:{..._.setup,baseCurrency:`CNY`}}}},D={name:`保存中`,args:{actions:{...c(_),saveDraft:()=>new Promise(()=>{})}},play:async({canvasElement:e})=>{let t=g(e.ownerDocument.body);await h.click(await t.findByRole(`button`,{name:/^下一步/}))}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "日本优先（默认展开）"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "展开购物·订阅",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", {
      name: "购物·订阅"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "全不选",
  args: {
    progress: createMerchantsProgress("jp", [])
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "中国优先",
  args: {
    progress: createMerchantsProgress("cn")
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "日本收起、中国餐饮展开",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", merchantRegionButtonName("jp")));
    await userEvent.click(await body.findByRole("button", merchantRegionButtonName("cn")));
    await userEvent.click(await body.findByRole("button", {
      name: "餐饮",
      expanded: false
    }));
    await userEvent.click(await body.findByRole("checkbox", {
      name: /海底捞/
    }));
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "两组都收起",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", merchantRegionButtonName("jp")));
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    progress: createMerchantsProgress("jp", defaultProgress.setup.draft.merchants.selectedKeys.filter(key => key !== "apple"))
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}},O=[`Default`,`ExpandShopping`,`SelectNone`,`ChinaFirst`,`AddedChina`,`BothCollapsed`,`Partial`,`DifferentCurrency`,`Saving`]}))();export{C as AddedChina,w as BothCollapsed,S as ChinaFirst,y as Default,E as DifferentCurrency,b as ExpandShopping,T as Partial,D as Saving,x as SelectNone,O as __namedExportsOrder,v as default};