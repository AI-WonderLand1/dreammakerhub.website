
import React from 'react';

const BYOCExplanation = () => {
    return (
        <div className="prose prose-invert max-w-none">
            <h2>Connect Your Cloud Storage</h2>
            <p>
                To get started, you need to connect to your own cloud storage provider.
                This is where your project files, scenes, and assets will be stored.
                We support the following providers:
            </p>
            <ul>
                <li>
                    <strong>Supabase:</strong>
                    <ul>
                        <li>Supabase URL</li>
                        <li>Supabase anon key</li>
                        <li>Bucket name</li>
                    </ul>
                </li>
                <li>
                    <strong>AWS S3:</strong>
                    <ul>
                        <li>Access key</li>
                        <li>Secret key</li>
                        <li>Bucket name</li>
                        <li>Region</li>
                    </ul>
                </li>
                <li>
                    <strong>GCP Storage:</strong>
                    <ul>
                        <li>Service account JSON</li>
                        <li>Bucket name</li>
                    </ul>
                </li>
            </ul>

            <h3 className="text-2xl font-bold">The 3 Things You Must Set Up for BYOC</h3>
            <p>
                Here’s the whole system in one table. This is "Bring Your Own Cloud" (BYOC).
            </p>
            <table className="w-full text-left">
                <thead>
                    <tr>
                        <th className="py-2">Layer</th>
                        <th className="py-2">Lives in YOUR cloud</th>
                        <th className="py-2">Lives in USER cloud</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2">Auth</td>
                        <td className="py-2">✔ Yes</td>
                        <td className="py-2">❌ No</td>
                    </tr>
                    <tr>
                        <td className="py-2">Workspace metadata</td>
                        <td className="py-2">✔ Yes</td>
                        <td className="py-2">❌ No</td>
                    </tr>
                    <tr>
                        <td className="py-2">Project files (GLB, images, scenes)</td>
                        <td className="py-2">❌ No</td>
                        <td className="py-2">✔ Yes</td>
                    </tr>
                    <tr>
                        <td className="py-2">Project JSON</td>
                        <td className="py-2">❌ No</td>
                        <td className="py-2">✔ Yes</td>
                    </tr>
                    <tr>
                        <td className="py-2">Exports</td>
                        <td className="py-2">❌ No</td>
                        <td className="py-2">✔ Yes</td>
                    </tr>
                    <tr>
                        <td className="py-2">AI generation</td>
                        <td className="py-2">✔ Yes</td>
                        <td className="py-2">❌ No</td>
                    </tr>
                    <tr>
                        <td className="py-2">Editor (WebGLStudio)</td>
                        <td className="py-2">✔ Yes</td>
                        <td className="py-2">❌ No</td>
                    </tr>
                    <tr>
                        <td className="py-2">Runtime (WonderPlay)</td>
                        <td className="py-2">✔ Yes</td>
                        <td className="py-2">❌ No</td>
                    </tr>
                </tbody>
            </table>
            <h4>STEP 1 — Your user connects THEIR cloud</h4>
            <p>You give them a settings screen:</p>
        </div>
    );
};

export default BYOCExplanation;
