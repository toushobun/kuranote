import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TextField-CWQLqbio.js";import{F as o,I as s}from"./iframe-CQKi8rKk.js";import{n as c,t as l}from"./TransactionBottomEditorDrawer-MV-p4Dib.js";var u,d,f,p,m,h;t((()=>{u=r(),d=e(n()),o(),a(),c(),f=`备注`,p={title:`Molecules/Transactions/TransactionBottomEditorDrawer`,component:l,args:{open:!0,title:f,onClose:()=>{},children:null}},m={name:`共用底部编辑抽屉`,render:function(e){let[t,n]=(0,d.useState)(!0);return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(s,{onClick:()=>n(!0),children:f}),(0,u.jsx)(l,{...e,open:t,onClose:()=>n(!1),children:(0,u.jsx)(i,{label:f,fullWidth:!0,multiline:!0,minRows:4})})]})}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "共用底部编辑抽屉",
  render: function NoteDrawer(args) {
    const [open, setOpen] = useState(true);
    return <>
        <Button onClick={() => setOpen(true)}>{noteTitle}</Button>
        <TransactionBottomEditorDrawer {...args} open={open} onClose={() => setOpen(false)}>
          <TextField label={noteTitle} fullWidth multiline minRows={4} />
        </TransactionBottomEditorDrawer>
      </>;
  }
}`,...m.parameters?.docs?.source}}},h=[`Note`]}))();export{m as Note,h as __namedExportsOrder,p as default};