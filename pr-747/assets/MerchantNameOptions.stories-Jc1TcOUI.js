import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./ConfirmDialogProvider-Bmgzjapy.js";import{n as i,r as a,t as o}from"./merchants-RfyI_T8F.js";import{n as s,t as c}from"./MerchantNameOptions-D_-8sKGG.js";var l,u,d,f,p,m,h,g,_,v,y,b;e((()=>{l=t(),a(),n(),s(),{expect:u,userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p=i({aliases:[o({is_preferred:!0}),o({alias:`LIFE`,id:`alias-2`})],display_name:`来福`}),m={title:`Organisms/Merchants/MerchantNameOptions`,component:c,args:{merchant:p,setPreferredAliasAction:async()=>{}},decorators:[e=>(0,l.jsx)(r,{children:(0,l.jsx)(e,{})})]},h={name:`列表页名称选项`},g={name:`编辑页整行选择`,args:{archiveAliasAction:async()=>{},variant:`rows`}},_={name:`删除别名前确认`,args:{archiveAliasAction:async()=>{},variant:`rows`},play:async({canvasElement:e})=>{let t=f(e),n=f(e.ownerDocument.body);await d.click(t.getByRole(`button`,{name:`移除别名来福`})),await u(n.getByRole(`heading`,{name:`删除别名？`})).toBeInTheDocument(),await u(n.getByText(/确认删除别名“来福”/)).toBeInTheDocument()}},v={name:`正式名为当前显示名`,args:{merchant:{...p,aliases:p.aliases.map(e=>({...e,is_preferred:!1})),display_name:p.name}}},y={name:`切换处理中`,args:{pending:!0}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "列表页名称选项"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "编辑页整行选择",
  args: {
    archiveAliasAction: async () => {},
    variant: "rows"
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "删除别名前确认",
  args: {
    archiveAliasAction: async () => {},
    variant: "rows"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", {
      name: "移除别名来福"
    }));
    await expect(body.getByRole("heading", {
      name: "删除别名？"
    })).toBeInTheDocument();
    await expect(body.getByText(/确认删除别名“来福”/)).toBeInTheDocument();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "正式名为当前显示名",
  args: {
    merchant: {
      ...merchant,
      aliases: merchant.aliases.map(alias => ({
        ...alias,
        is_preferred: false
      })),
      display_name: merchant.name
    }
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "切换处理中",
  args: {
    pending: true
  }
}`,...y.parameters?.docs?.source}}},b=[`Chips`,`Rows`,`DeleteConfirmation`,`FormalNameSelected`,`Pending`]}))();export{h as Chips,_ as DeleteConfirmation,v as FormalNameSelected,y as Pending,g as Rows,b as __namedExportsOrder,m as default};