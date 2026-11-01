import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./GroupedPresetChecklist-DO9AggvA.js";function o(e){let[t,n]=(0,c.useState)(e.selectedKeys);return(0,s.jsx)(a,{...e,onChange:t=>{e.onChange(t),n(t)},selectedKeys:t})}var s,c,l,u,d,f,p,m,h,g,_,v;t((()=>{s=r(),c=e(n()),i(),{userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d=[{icon:`🛒`,itemKeys:[`aeon`,`seiyu`,`life`],key:`supermarket`,name:`超市`},{icon:`📦`,itemKeys:[`amazon`,`rakuten`,`mercari`],key:`ecommerce`,name:`电商`},{icon:`🎬`,itemKeys:[`amazon`,`netflix`,`spotify`],key:`subscription`,name:`订阅服务`}],f=[{key:`aeon`,name:`イオン`,secondaryText:`aeon.com`},{key:`seiyu`,name:`西友`,secondaryText:`seiyu.co.jp`},{key:`life`,name:`ライフ`,secondaryText:`lifecorp.jp`},{key:`amazon`,name:`Amazon`,secondaryText:`amazon.co.jp`},{key:`rakuten`,name:`楽天`,secondaryText:`rakuten.co.jp`},{key:`mercari`,name:`メルカリ`},{key:`netflix`,name:`Netflix`,secondaryText:`netflix.com`},{key:`spotify`,name:`Spotify`,secondaryText:`spotify.com`}],p={title:`Molecules/UI/GroupedPresetChecklist`,component:a,render:e=>(0,s.jsx)(o,{...e}),args:{groups:d,items:f,messages:{groupCheckboxLabel:e=>`选择「${e}」的全部项目`,groupSelectedCount:(e,t)=>`已选 ${e} / ${t} 家`,selectAll:`全选`,selectNone:`全不选`},onChange:()=>{},selectedKeys:[`aeon`,`seiyu`,`life`]},parameters:{viewport:{defaultViewport:`mobile2`}}},m={name:`收起`},h={name:`展开多个分组（多分组项目联动）`,args:{selectedKeys:[`aeon`,`amazon`]},play:async({canvasElement:e})=>{let t=u(e);await l.click(t.getByRole(`button`,{name:`电商`})),await l.click(t.getByRole(`button`,{name:`订阅服务`}))}},g={name:`部分选中`,args:{selectedKeys:[`aeon`,`amazon`,`netflix`]}},_={args:{disabledKeys:[`aeon`,`seiyu`,`life`,`amazon`],selectedKeys:[`rakuten`],messages:{added:`已添加`,groupCheckboxLabel:e=>`选择「${e}」的全部项目`,groupSelectedCount:(e,t,n)=>`已选 ${e} / ${t} 家${n?` · 已添加 ${n} 家`:``}`,selectAll:`全选`,selectNone:`全不选`}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "收起"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "展开多个分组（多分组项目联动）",
  args: {
    selectedKeys: ["aeon", "amazon"]
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "电商"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "订阅服务"
    }));
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "部分选中",
  args: {
    selectedKeys: ["aeon", "amazon", "netflix"]
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    disabledKeys: ["aeon", "seiyu", "life", "amazon"],
    selectedKeys: ["rakuten"],
    messages: {
      added: "已添加",
      groupCheckboxLabel: name => \`选择「\${name}」的全部项目\`,
      groupSelectedCount: (selected, total, added) => \`已选 \${selected} / \${total} 家\${added ? \` · 已添加 \${added} 家\` : ""}\`,
      selectAll: "全选",
      selectNone: "全不选"
    }
  }
}`,..._.parameters?.docs?.source}}},v=[`Collapsed`,`ExpandedMultiple`,`PartiallySelected`,`AlreadyAdded`]}))();export{_ as AlreadyAdded,m as Collapsed,h as ExpandedMultiple,g as PartiallySelected,v as __namedExportsOrder,p as default};