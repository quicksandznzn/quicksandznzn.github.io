import * as stylex from '@stylexjs/stylex';
import { colors } from './tokens.stylex';

const MOBILE = '@media (max-width: 640px)';

export const s = stylex.create({
  wrap: { width:'calc(100% - 40px)', maxWidth:760, marginInline:'auto' },
  skip: { position:'fixed', top:{ default:-80, ':focus':12 }, left:16, zIndex:10, padding:10, backgroundColor:colors['--ink'], color:colors['--page'] },
  homeHeader: { paddingTop:{ default:72, [MOBILE]:44 }, paddingBottom:{ default:48, [MOBILE]:36 } },
  homeTop: { display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:20, flexWrap:'wrap' },
  homeLinks: { display:'flex', gap:18, color:colors['--accent'], fontSize:13 },
  themeButton: { padding:0, borderWidth:0, backgroundColor:'transparent', color:{ default:colors['--accent'], ':hover':colors['--ink'] }, fontSize:13, cursor:'pointer' },
  homeTitle: { fontSize:{ default:28, [MOBILE]:25 }, lineHeight:1.25, letterSpacing:-.7, fontWeight:600 },
  homeIntro: { maxWidth:560, marginTop:12, color:colors['--muted'], fontSize:15, lineHeight:1.75 },
  visuallyHidden: { position:'absolute', width:1, height:1, padding:0, margin:-1, overflow:'hidden', clip:'rect(0, 0, 0, 0)', whiteSpace:'nowrap', borderWidth:0 },
  postList: { listStyle:'none', padding:0, margin:0 },
  postItem: { display:'grid', gridTemplateColumns:{ default:'104px 1fr', [MOBILE]:'1fr' }, gap:{ default:20, [MOBILE]:4 }, paddingBlock:18, borderTopWidth:1, borderTopStyle:'solid', borderTopColor:colors['--line'] },
  postDate: { paddingTop:3, color:colors['--muted'], fontSize:13, fontVariantNumeric:'tabular-nums' },
  postTitle: { color:{ default:colors['--accent'], ':hover':colors['--ink'] }, fontSize:17, fontWeight:500, lineHeight:1.5, overflowWrap:'anywhere' },
  postDescription: { marginTop:5, color:colors['--muted'], fontSize:14, lineHeight:1.7 },
  empty: { minHeight:'70vh', paddingTop:72 },
  articleHeader: { paddingTop:{ default:58, [MOBILE]:38 }, paddingBottom:36 },
  articleTop: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, marginBottom:30 },
  back: { display:'inline-block', color:colors['--accent'], fontSize:13 },
  articleTitle: { fontSize:{ default:36, [MOBILE]:29 }, lineHeight:1.3, letterSpacing:-1, fontWeight:600, overflowWrap:'anywhere' },
  articleDescription: { color:colors['--muted'], fontSize:15, lineHeight:1.75, marginTop:14 },
  meta: { display:'flex', gap:16, color:colors['--muted'], fontSize:12, marginTop:16 },
  articleBody: { minWidth:0, paddingBottom:44 },
  copy: { position:'absolute', right:8, top:8, borderWidth:1, borderStyle:'solid', borderColor:colors['--line'], color:colors['--muted'], backgroundColor:colors['--page'], fontSize:10, paddingBlock:3, paddingInline:8, borderRadius:4 },
});
