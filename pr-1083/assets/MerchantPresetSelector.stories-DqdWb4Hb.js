import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,r,t as i}from"./merchantPresetSelectorTestUtils-CJqqyv4z.js";var a,o,s,c,l,u,d,f,p;e((()=>{a=t(),n(),{userEvent:o,within:s}=__STORYBOOK_MODULE_TEST__,c={title:`Organisms/Merchants/MerchantPresetSelector`,component:i,parameters:{viewport:{defaultViewport:`iphone14`}},decorators:[e=>(0,a.jsx)(`div`,{style:{maxWidth:390,padding:16},children:(0,a.jsx)(e,{})})]},l={name:`日本优先（默认展开）`},u={name:`展开购物·订阅`,play:async({canvasElement:e})=>{await o.click(s(e).getByRole(`button`,{name:`购物·订阅`}))}},d={name:`追加中国`,play:async({canvasElement:e})=>{await o.click(s(e).getByRole(`button`,r(`cn`)))}},f={name:`部分选中`,args:{initialSelectedKeys:[`apple`,`starbucks`]}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "日本优先（默认展开）"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "展开购物·订阅",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "购物·订阅"
    }));
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "追加中国",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", merchantRegionButtonName("cn")));
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    initialSelectedKeys: ["apple", "starbucks"]
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`Expanded`,`AddedChina`,`Partial`]}))();export{d as AddedChina,l as Default,u as Expanded,f as Partial,p as __namedExportsOrder,c as default};