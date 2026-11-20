import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./ConfirmDialogProvider-Dd3wjDG8.js";import{n as i,t as a}from"./MerchantDisplayNameDrawer-pirzg1ak.js";var o,s,c,l,u,d,f,p,m,h;e((()=>{o=t(),n(),i(),{expect:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Merchants/MerchantDisplayNameDrawer`,component:a,args:{aliases:[{id:`alias-1`,alias:`来福`},{id:`alias-2`,alias:`ライフ`}],merchantName:`LIFE超市`,open:!0,sessionId:1,onClose:()=>{},onConfirm:()=>{},preferredAliasId:`alias-1`},decorators:[e=>(0,o.jsx)(r,{children:(0,o.jsx)(e,{})})]},d={name:`有别名·当前选中来福`},f={name:`没有别名`,args:{aliases:[],preferredAliasId:null}},p={name:`输入重复别名提示`,play:async({canvasElement:e})=>{let t=l(e.ownerDocument.body),n=t.getByRole(`textbox`,{name:`输入新的别名`});await c.type(n,`来福`),await c.click(t.getByRole(`button`,{name:`添加`})),await s(t.getByRole(`alert`)).toHaveTextContent(`重复`)}},m={name:`删除确认`,play:async({canvasElement:e})=>{let t=l(e.ownerDocument.body);await c.click(t.getByRole(`button`,{name:`移除别名来福`})),await s(t.getByRole(`heading`,{name:`删除别名「来福」？`})).toBeInTheDocument()}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "有别名·当前选中来福"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "没有别名",
  args: {
    aliases: [],
    preferredAliasId: null
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "输入重复别名提示",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = body.getByRole("textbox", {
      name: "输入新的别名"
    });
    await userEvent.type(input, "来福");
    await userEvent.click(body.getByRole("button", {
      name: "添加"
    }));
    await expect(body.getByRole("alert")).toHaveTextContent("重复");
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "删除确认",
  play: async ({
    canvasElement
  }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", {
      name: "移除别名来福"
    }));
    await expect(body.getByRole("heading", {
      name: "删除别名「来福」？"
    })).toBeInTheDocument();
  }
}`,...m.parameters?.docs?.source}}},h=[`WithAliases`,`WithoutAliases`,`DuplicateInput`,`DeleteConfirmation`]}))();export{m as DeleteConfirmation,p as DuplicateInput,d as WithAliases,f as WithoutAliases,h as __namedExportsOrder,u as default};