import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{b as i,g as a,l as o,u as s,v as c,x as l,y as u}from"./iframe-855jWRNy.js";import{n as d,t as f}from"./Stack-DRbcmy6F.js";import{n as p,t as m}from"./Box-D6GIJTIJ.js";import{n as h,t as g}from"./Typography-CwLqrFKa.js";import{n as _,r as v}from"./DynamicMuiThemeProvider-B6dsITXj.js";import{i as y,n as b,r as x,t as S}from"./SortableItem-DOlQm7bG.js";import{n as C,r as w,t as T}from"./merchants-RfyI_T8F.js";import{n as E,t as D}from"./MerchantCard-B_ZbM_8T.js";function O(){return(0,k.jsx)(d,{spacing:1.5,children:c.map(e=>{let t=u[e];return(0,k.jsx)(l,{theme:_(e),children:(0,k.jsx)(p,{style:o(e),sx:{bgcolor:`background.default`,border:1,borderColor:`divider`,borderRadius:2,p:2},children:(0,k.jsxs)(d,{spacing:1,children:[(0,k.jsx)(h,{sx:{fontWeight:700},children:t.name}),(0,k.jsx)(D,{editHref:`/merchants/merchant-1/edit`,ledgerId:`ledger-1`,merchant:j,setPreferredAliasAction:async()=>{}})]})})},e)})})}var k,A,j,M,N,P,F,I,L,R,z,B,V,H;t((()=>{k=r(),m(),f(),i(),g(),A=e(n()),w(),v(),s(),a(),y(),b(),E(),j=C({aliases:[T({is_preferred:!0}),T({alias:`LIFE`,id:`alias-2`,sort_order:2})],display_name:`来福`,note:`常去的超市`,tags:[{icon:`🛒`,id:`tag-supermarket`,merchant_count:1,name:`超市`,sort_order:1},{icon:`🧴`,id:`tag-daily`,merchant_count:1,name:`日用`,sort_order:2},{icon:`🛋️`,id:`tag-home`,merchant_count:1,name:`家居`,sort_order:3}]}),M={title:`Organisms/Merchants/MerchantCard`,component:D,args:{setPreferredAliasAction:async()=>{},editHref:`/merchants/merchant-1/edit`,ledgerId:`ledger-1`,merchant:j}},N={name:`正式名身份与首选别名`},P={name:`无别名`,args:{editHref:`/merchants/merchant-1/edit`,ledgerId:`ledger-1`,merchant:C({aliases:[]})}},F={name:`全部个人主题对比`,render:()=>(0,k.jsx)(O,{})},I={name:`点击名称切换显示名`,render:function(e){let[t,n]=(0,A.useState)(e.merchant);return(0,k.jsx)(D,{...e,merchant:t,setPreferredAliasAction:async e=>{let t=e.get(`aliasId`);n(e=>({...e,display_name:e.aliases.find(e=>e.id===t)?.alias??e.name,aliases:e.aliases.map(e=>({...e,is_preferred:e.id===t}))}))}})}},L={name:`切换处理中`,args:{pending:!0}},R={name:`正式名身份与当前显示名同时标记`,args:{merchant:{...j,display_name:j.name,aliases:j.aliases.map(e=>({...e,is_preferred:!1}))}}},z={name:`只读成员`,args:{canManageMerchants:!1}},B={name:`常驻手柄与拖拽排序`,render:function(e){let[t,n]=(0,A.useState)([e.merchant,C({id:`merchant-2`,name:`便利店`})]);return(0,k.jsx)(x,{items:t.map(e=>e.id),onReorder:e=>n(e.flatMap(e=>t.find(t=>t.id===e)??[])),children:(0,k.jsx)(d,{spacing:1,sx:{maxWidth:480},children:t.map(t=>(0,k.jsx)(S,{id:t.id,children:n=>(0,k.jsx)(D,{...e,merchant:t,handleProps:n})},t.id))})})}},V={name:`筛选或保存期间禁用排序`,args:{handleProps:{disabled:!0}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "正式名身份与首选别名"
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "无别名",
  args: {
    editHref: "/merchants/merchant-1/edit",
    ledgerId: "ledger-1",
    merchant: createMerchantRow({
      aliases: []
    })
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "全部个人主题对比",
  render: () => <MerchantCardThemePreview />
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "点击名称切换显示名",
  render: function InteractiveNames(args) {
    const [merchant, setMerchant] = useState(args.merchant);
    return <MerchantCard {...args} merchant={merchant} setPreferredAliasAction={async data => {
      const aliasId = data.get("aliasId");
      setMerchant(current => ({
        ...current,
        display_name: current.aliases.find(alias => alias.id === aliasId)?.alias ?? current.name,
        aliases: current.aliases.map(alias => ({
          ...alias,
          is_preferred: alias.id === aliasId
        }))
      }));
    }} />;
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "切换处理中",
  args: {
    pending: true
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "正式名身份与当前显示名同时标记",
  args: {
    merchant: {
      ...merchant,
      display_name: merchant.name,
      aliases: merchant.aliases.map(alias => ({
        ...alias,
        is_preferred: false
      }))
    }
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "只读成员",
  args: {
    canManageMerchants: false
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "常驻手柄与拖拽排序",
  render: function SortableCards(args) {
    const [merchants, setMerchants] = useState([args.merchant, createMerchantRow({
      id: "merchant-2",
      name: "便利店"
    })]);
    return <SortableList items={merchants.map(item => item.id)} onReorder={ids => setMerchants(ids.flatMap(id => merchants.find(item => item.id === id) ?? []))}>
        <Stack spacing={1} sx={{
        maxWidth: 480
      }}>
          {merchants.map(item => <SortableItem key={item.id} id={item.id}>
              {handleProps => <MerchantCard {...args} merchant={item} handleProps={handleProps} />}
            </SortableItem>)}
        </Stack>
      </SortableList>;
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "筛选或保存期间禁用排序",
  args: {
    handleProps: {
      disabled: true
    }
  }
}`,...V.parameters?.docs?.source}}},H=[`Default`,`WithoutAliases`,`MultipleThemes`,`Interactive`,`Pending`,`FormalNameSelected`,`ReadOnly`,`Sortable`,`SortingDisabled`]}))();export{N as Default,R as FormalNameSelected,I as Interactive,F as MultipleThemes,L as Pending,z as ReadOnly,B as Sortable,V as SortingDisabled,P as WithoutAliases,H as __namedExportsOrder,M as default};