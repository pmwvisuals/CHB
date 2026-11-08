import { registerHooks } from 'node:module';
import { extname } from 'node:path';
registerHooks({resolve(specifier,context,nextResolve){
  if(specifier.startsWith('.')&&!extname(specifier)) return nextResolve(specifier+'.ts',context);
  return nextResolve(specifier,context);
}});
await import('../tests/game.test.ts');
await import('../tests/progression.test.ts');
await import('../tests/vegetation.test.ts');
await import('../tests/landscape.test.ts');
await import('../tests/exteriors.test.ts');
