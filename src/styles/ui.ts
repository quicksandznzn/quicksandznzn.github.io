import * as stylex from '@stylexjs/stylex';
import { colors } from './tokens.stylex';

const MOBILE = '@media (max-width: 640px)';

export const s = stylex.create({
  wrap: { width:'calc(100% - 40px)', maxWidth:760, marginInline:'auto' },
  skip: { position:'fixed', top:{ default:-80, ':focus':12 }, left:16, zIndex:10, padding:10, backgroundColor:colors['--ink'], color:colors['--page'] },
  homeHeader: { paddingTop:{ default:58, [MOBILE]:34 }, paddingBottom:{ default:42, [MOBILE]:34 } },
  homeTop: { display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', gap:{ default:20, [MOBILE]:12 } },
  homeLinks: { display:'flex', alignItems:'center', gap:{ default:18, [MOBILE]:12 }, color:colors['--muted'], fontSize:{ default:13, [MOBILE]:12 } },
  themeButton: { width:34, height:34, padding:0, borderWidth:1, borderStyle:'solid', borderColor:colors['--line'], borderRadius:'50%', display:'grid', placeItems:'center', backgroundColor:{ default:'transparent', ':hover':colors['--panel'] }, color:{ default:colors['--muted'], ':hover':colors['--ink'] }, cursor:'pointer', transform:{ default:'none', ':active':'scale(.96)' }, transition:'background-color 160ms ease,color 160ms ease,border-color 160ms ease' },
  homeTitle: { fontSize:{ default:29, [MOBILE]:22 }, lineHeight:1.2, letterSpacing:-.8, fontWeight:600, whiteSpace:'nowrap' },
  homeIntro: { maxWidth:560, marginTop:12, color:colors['--muted'], fontSize:{ default:15, [MOBILE]:14 }, lineHeight:1.75 },
  sectionTitle: { marginBottom:12, color:colors['--ink'], fontSize:13, fontWeight:500 },
  postList: { listStyle:'none', padding:0, margin:0 },
  postItem: { display:'grid', gridTemplateColumns:{ default:'104px 1fr', [MOBILE]:'1fr' }, gap:{ default:20, [MOBILE]:3 }, paddingBlock:{ default:14, [MOBILE]:15 } },
  postDate: { paddingTop:3, color:colors['--muted'], fontSize:13, fontVariantNumeric:'tabular-nums' },
  postTitle: { color:{ default:colors['--ink'], ':hover':colors['--accent'] }, fontSize:{ default:16, [MOBILE]:16 }, fontWeight:500, lineHeight:1.5, overflowWrap:'anywhere', textDecoration:{ default:'none', ':hover':'underline' }, textUnderlineOffset:4, transition:'color 140ms ease' },
  postDescription: { marginTop:4, color:colors['--muted'], fontSize:{ default:13.5, [MOBILE]:13.5 }, lineHeight:1.65 },
  empty: { minHeight:'70vh', paddingTop:72 },
  articleHeader: { maxWidth:680, paddingTop:{ default:58, [MOBILE]:36 }, paddingBottom:36 },
  articleTop: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, marginBottom:30 },
  back: { display:'inline-block', color:colors['--accent'], fontSize:13 },
  articleTitle: { fontSize:{ default:36, [MOBILE]:28 }, lineHeight:1.3, letterSpacing:-1, fontWeight:600, overflowWrap:'anywhere' },
  articleDescription: { color:colors['--muted'], fontSize:15, lineHeight:1.75, marginTop:14 },
  meta: { display:'flex', gap:16, color:colors['--muted'], fontSize:12, marginTop:16 },
  articleBody: { minWidth:0, maxWidth:680, paddingBottom:56 },
  copy: { position:'absolute', right:8, top:8, borderWidth:1, borderStyle:'solid', borderColor:colors['--line'], color:colors['--muted'], backgroundColor:colors['--page'], fontSize:10, paddingBlock:3, paddingInline:8, borderRadius:4 },
});
