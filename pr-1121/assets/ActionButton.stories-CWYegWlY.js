import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-B_0Lz4TE.js";import{g as i,h as a}from"./iframe-DZG8HUQU.js";import{n as o,t as s}from"./Stack-CedAN9w3.js";import{n as c,t as l}from"./actionPendingMessages-B03PK8BF.js";import{n as u,t as d}from"./ActionButton-NttSN-Qw.js";var f,p,m,h,g,_,v,y;e((()=>{f=t(),s(),r(),c(),i(),u(),p={borderRadius:`${a.radius.full}px`},m={title:`Atoms/UI/ActionButton`,component:d,args:{children:`保存`,pendingLabel:l.save,variant:`contained`,sx:p}},h={name:`主按钮`},g={name:`主按钮处理中`,args:{pending:!0}},_={name:`主按钮不可用`,args:{disabled:!0}},v={name:`主按钮 / 描边 / 危险 × 常态 / 处理中 / 不可用`,render:()=>(0,f.jsx)(o,{spacing:2,children:[{label:`主按钮`,variant:`contained`,color:`primary`},{label:`描边`,variant:`outlined`,color:`primary`},{label:`危险`,variant:`outlined`,color:`error`}].map(({label:e,variant:t,color:r})=>(0,f.jsxs)(o,{spacing:1,children:[(0,f.jsx)(n,{variant:`subtitle2`,children:e}),(0,f.jsxs)(o,{direction:`row`,spacing:1,children:[(0,f.jsx)(d,{variant:t,color:r,sx:p,pendingLabel:l.save,children:`保存`}),(0,f.jsx)(d,{variant:t,color:r,sx:p,pending:!0,pendingLabel:l.save,children:`保存`}),(0,f.jsx)(d,{variant:t,color:r,sx:p,disabled:!0,pendingLabel:l.save,children:`保存`})]})]},e))})},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "主按钮"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "主按钮处理中",
  args: {
    pending: true
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "主按钮不可用",
  args: {
    disabled: true
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "主按钮 / 描边 / 危险 × 常态 / 处理中 / 不可用",
  render: () => <Stack spacing={2}>
      {([{
      label: "主按钮",
      variant: "contained" as const,
      color: "primary" as const
    }, {
      label: "描边",
      variant: "outlined" as const,
      color: "primary" as const
    }, {
      label: "危险",
      variant: "outlined" as const,
      color: "error" as const
    }] as const).map(({
      label,
      variant,
      color
    }) => <Stack spacing={1} key={label}>
          <Typography variant="subtitle2">{label}</Typography>
          <Stack direction="row" spacing={1}>
            <ActionButton variant={variant} color={color} sx={pillSx} pendingLabel={actionPendingMessages.save}>
              保存
            </ActionButton>
            <ActionButton variant={variant} color={color} sx={pillSx} pending pendingLabel={actionPendingMessages.save}>
              保存
            </ActionButton>
            <ActionButton variant={variant} color={color} sx={pillSx} disabled pendingLabel={actionPendingMessages.save}>
              保存
            </ActionButton>
          </Stack>
        </Stack>)}
    </Stack>
}`,...v.parameters?.docs?.source}}},y=[`Default`,`Pending`,`Disabled`,`Variants`]}))();export{h as Default,_ as Disabled,g as Pending,v as Variants,y as __namedExportsOrder,m as default};