import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TextField-BVEOxpKI.js";import{n as o,t as s}from"./Button-BUz5fAjB.js";import{n as c,t as l}from"./transactionStepFlowMessages-CO3jaqwL.js";import{n as u,t as d}from"./TransactionBottomEditorDrawer-DZ9wn7MG.js";var f,p,m,h,g;t((()=>{f=r(),p=e(n()),s(),a(),u(),c(),m={title:`Molecules/Transactions/TransactionBottomEditorDrawer`,component:d,args:{open:!0,title:l.note,onClose:()=>{},children:null}},h={name:`共用底部编辑抽屉`,render:function(e){let[t,n]=(0,p.useState)(!0);return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(o,{onClick:()=>n(!0),children:l.note}),(0,f.jsx)(d,{...e,open:t,onClose:()=>n(!1),children:(0,f.jsx)(i,{label:l.note,fullWidth:!0,multiline:!0,minRows:4})})]})}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "共用底部编辑抽屉",
  render: function NoteDrawer(args) {
    const [open, setOpen] = useState(true);
    return <>
        <Button onClick={() => setOpen(true)}>{m.note}</Button>
        <TransactionBottomEditorDrawer {...args} open={open} onClose={() => setOpen(false)}>
          <TextField label={m.note} fullWidth multiline minRows={4} />
        </TransactionBottomEditorDrawer>
      </>;
  }
}`,...h.parameters?.docs?.source}}},g=[`Note`]}))();export{h as Note,g as __namedExportsOrder,m as default};