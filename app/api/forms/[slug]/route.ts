import { NextResponse, NextRequest } from 'next/server';
import { getMongoDO, MongoDOStub, EnvWithMongoDO } from '@/lib/mongoClient';
import constants from '@/lib/constants';
import apiError from '@/lib/apiError';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// don't cache
export const revalidate = 0;

type Params = {
  slug: string;
};

export async function GET(req: NextRequest, props: { params: Promise<Params> }) {
  const params = await props.params;
  console.log(`[API forms/${params.slug}] Handler started.`);
  try {
    const context = getCloudflareContext();
    const env = context.env as EnvWithMongoDO;

    if (!env.MONGO_DO) {
        console.error(`[API forms/${params.slug}] MONGO_DO binding missing from Cloudflare context! Check wrangler.toml and deployment.`);
        return apiError(new Error("Server configuration error: DB binding missing."));
    }

    const mongoDO = getMongoDO(env);

    const uid = req.headers.get('x-uid') as string;
    console.log(`[API forms/${params.slug}] UID: ${uid}. Calling DO.findOne...`);

    const form = await mongoDO.findOne(constants.COL_FORMS, { slug: params.slug });

    console.log(`[API forms/${params.slug}] DO.findOne completed. Form found:`, !!form);

    if (!form) {
       console.log(`[API forms/${params.slug}] Form not found via DO.`);
       return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { draft, _id, ...otherVals } = form;

    console.log(`[API forms/${params.slug}] Preparing response...`);
    return NextResponse.json({
      ...otherVals,
      ...(draft && { ...draft }),
      uid: uid,
      slug: params.slug,
    });
  } catch (e) {
    console.error(`[API forms/${params.slug}] Error caught:`, e);
    return apiError(e);
  }
}
