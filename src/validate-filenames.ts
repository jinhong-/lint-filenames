import * as pathp from 'path';
import fs from 'fs';
import glob from 'glob-promise';

export async function validateFilenames(
  pathOrGlob: string,
  pattern: RegExp,
  mode?: 'PATH' | 'GLOB',
  ignoreGlob?: string[]
): Promise<{
  totalFilesAnalyzed: number;
  failedFiles: string[];
}> {
  console.log(`ℹ️  Path:    \t\t'${pathOrGlob}'`);
  console.log(`ℹ️  Pattern: \t\t${pattern}`);
  const opendir = fs.promises.opendir;
  const failedFiles: string[] = [];
  let totalFilesAnalyzed = 0;

  try {
    console.log('Verification starting...');

    let pathsToAnalyze: string[];

    if (mode === 'GLOB') {
      let matches = await glob(pathOrGlob, {
        dot: true,
        ignore: ignoreGlob,
      });
      matches = matches.map(function (match) {
        return pathp.relative('.', match);
      });
      pathsToAnalyze = matches;
    } else {
      const dir = await opendir(pathOrGlob);
      pathsToAnalyze = [];
      for await (const dirent of dir) {
        if (dirent.isDirectory()) {
          continue;
        }
        pathsToAnalyze.push(dirent.name);
      }
    }

    for (const p of pathsToAnalyze) {
      if (pattern.test(p)) {
        console.log(`  ✔️  ${p}`);
      } else {
        console.log(`  ❌  ${p}`);
        failedFiles.push(p);
      }
    }
    totalFilesAnalyzed = pathsToAnalyze.length;

    console.log('Verification finished.');
    console.log(`ℹ️  Files analyzed: \t${totalFilesAnalyzed}`);
  } catch (error) {
    throw new Error('Execution failed, see log above. ❌');
  }

  if (failedFiles.length) {
    throw new Error(
      `${failedFiles.length} files not matching the pattern were found, see log above. ❌`
    );
  } else {
    console.log('✅ Success: All files match the given pattern!');

    return {
      totalFilesAnalyzed,
      failedFiles,
    };
  }
}
