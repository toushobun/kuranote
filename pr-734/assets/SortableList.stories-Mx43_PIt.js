import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./iframe-CEj5kk-R.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-BgJ7m11s.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{n as f,t as p}from"./SoftCard-D3Tv7LBc.js";import{n as m,t as h}from"./IconButton-BvjujjMV.js";import{n as g,t as _}from"./DragIndicatorRounded-BmXvNzy7.js";import{a as v,i as y,n as b,o as x,r as S,t as C}from"./SortableItem-DcUWMNJk.js";var w,T,E,D,O,k,A;t((()=>{w=r(),g(),v(),l(),h(),s(),d(),T=e(n()),f(),i(),y(),b(),E={title:`Molecules/UI/SortableList`,component:S,args:{items:[`餐饮`,`日用`,`出行`],onReorder:()=>{},children:null},render:function(e){let[t,n]=(0,T.useState)(e.items);return(0,w.jsx)(S,{...e,items:t,onReorder:n,children:(0,w.jsx)(o,{spacing:1.5,sx:{maxWidth:480,p:2},children:t.map(e=>(0,w.jsx)(C,{id:e,children:t=>(0,w.jsx)(p,{sx:{p:2},children:(0,w.jsxs)(o,{direction:`row`,sx:{alignItems:`center`,justifyContent:`space-between`},children:[(0,w.jsx)(u,{children:e}),(0,w.jsx)(m,{...t,"aria-label":`调整${e}排序`,sx:{cursor:`grab`,touchAction:`none`},children:(0,w.jsx)(_,{})})]})})},e))})})}},D={name:`跟手抬起与实时让位`},O={name:`提交中禁用排序`,args:{disabled:!0}},k={name:`换行网格排序`,args:{items:[`早餐`,`外食`,`食材`,`咖啡`,`零食`,`日用品`,`交通`]},parameters:{docs:{description:{story:`flex-wrap 布局使用 rectSortingStrategy，拖动跨行项目时按二维矩形位置实时让位。`}}},render:function(e){let[t,n]=(0,T.useState)(e.items);return(0,w.jsx)(S,{...e,items:t,onReorder:n,strategy:x,children:(0,w.jsx)(c,{sx:{display:`flex`,flexWrap:`wrap`,gap:1,maxWidth:420,p:2},children:t.map(e=>(0,w.jsx)(C,{id:e,sx:{display:`inline-flex`,width:`auto`},children:t=>(0,w.jsxs)(c,{sx:{alignItems:`center`,bgcolor:`background.paper`,border:1,borderColor:`divider`,borderRadius:`${a.radius.full}px`,display:`inline-flex`,gap:.5,pl:1.5,pr:.5,py:.5},children:[(0,w.jsx)(u,{sx:{fontWeight:700},variant:`body2`,children:e}),(0,w.jsx)(m,{...t,"aria-label":`调整${e}排序`,size:`small`,sx:{cursor:`grab`,touchAction:`none`},children:(0,w.jsx)(_,{fontSize:`small`})})]})},e))})})}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "跟手抬起与实时让位"
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "提交中禁用排序",
  args: {
    disabled: true
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "换行网格排序",
  args: {
    items: ["早餐", "外食", "食材", "咖啡", "零食", "日用品", "交通"]
  },
  parameters: {
    docs: {
      description: {
        story: "flex-wrap 布局使用 rectSortingStrategy，拖动跨行项目时按二维矩形位置实时让位。"
      }
    }
  },
  render: function Grid(args) {
    const [items, setItems] = useState(args.items);
    return <SortableList {...args} items={items} onReorder={setItems} strategy={rectSortingStrategy}>
        <Box sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        maxWidth: 420,
        p: 2
      }}>
          {items.map(id => <SortableItem id={id} key={id} sx={{
          display: "inline-flex",
          width: "auto"
        }}>
              {handle => <Box sx={{
            alignItems: "center",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: \`\${designTokens.radius.full}px\`,
            display: "inline-flex",
            gap: 0.5,
            pl: 1.5,
            pr: 0.5,
            py: 0.5
          }}>
                  <Typography sx={{
              fontWeight: 700
            }} variant="body2">
                    {id}
                  </Typography>
                  <IconButton {...handle} aria-label={\`调整\${id}排序\`} size="small" sx={{
              cursor: "grab",
              touchAction: "none"
            }}>
                    <DragIndicatorRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>}
            </SortableItem>)}
        </Box>
      </SortableList>;
  }
}`,...k.parameters?.docs?.source}}},A=[`Default`,`Disabled`,`WrappedGrid`]}))();export{D as Default,O as Disabled,k as WrappedGrid,A as __namedExportsOrder,E as default};