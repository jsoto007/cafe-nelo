import SectionTitle from '../components/SectionTitle.jsx';

const year = new Date().getFullYear();

export default function LicensePage() {
  return (
    <main className="bg-white text-gray-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <SectionTitle
          eyebrow="Legal"
          title="Proprietary Software License"
          description="All rights reserved. This software and associated assets are protected by copyright law."
        />

        <div className="space-y-1 text-xs uppercase tracking-[0.3em] text-gray-500">
          <p>Copyright © {year} Soto Dev LLC. All Rights Reserved.</p>
          <p>Café Nelo · Bronxville, NY</p>
        </div>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Ownership</p>
          <p className="text-sm text-gray-600">
            This software, including all source code, design systems, UI/UX, visual styles, layout structures,
            component architecture, and any associated assets (collectively, the "Software"), is the exclusive
            intellectual property of <strong>Soto Dev LLC</strong>.
          </p>
          <p className="text-sm text-gray-600">
            The name <strong>"Café Nelo"</strong>, associated branding, logos, trade dress, and any trademarks
            displayed within this application are the exclusive property of <strong>Café Nelo</strong> and may
            not be used without prior written consent from Café Nelo.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">License Terms</p>
          <p className="text-sm text-gray-600">
            This is <strong>not</strong> an open-source license. No rights are granted beyond those explicitly
            stated below.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">You May</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="list-disc pl-5">
              View this Software for personal, non-commercial evaluation purposes only.
            </li>
            <li className="list-disc pl-5">
              Reference this Software as an example of work produced by Soto Dev LLC.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">You May Not</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="list-disc pl-5">
              Copy, reproduce, or duplicate any portion of this Software.
            </li>
            <li className="list-disc pl-5">
              Modify, adapt, translate, or create derivative works based on this Software.
            </li>
            <li className="list-disc pl-5">
              Distribute, sublicense, sell, resell, transfer, assign, or otherwise commercially exploit this
              Software or any portion thereof.
            </li>
            <li className="list-disc pl-5">
              Reverse engineer, decompile, disassemble, or attempt to extract the source code of this Software.
            </li>
            <li className="list-disc pl-5">
              Use the code structure, design patterns, UI components, or styling of this Software as the basis
              for any other project.
            </li>
            <li className="list-disc pl-5">
              Remove or alter any copyright, trademark, or proprietary notices contained within this Software.
            </li>
            <li className="list-disc pl-5">
              Use the name "Café Nelo" or any associated branding in any context without the express written
              permission of Café Nelo.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
            No License by Implication
          </p>
          <p className="text-sm text-gray-600">
            Nothing in this document or in the act of making this Software viewable shall be construed as
            granting any license or right to use any intellectual property of Soto Dev LLC or Café Nelo by
            implication, estoppel, or otherwise, except as explicitly stated herein.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Enforcement</p>
          <p className="text-sm text-gray-600">
            Unauthorized use, reproduction, or distribution of this Software or any portion of it may result
            in civil and criminal penalties and will be prosecuted to the maximum extent possible under the law.
          </p>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Contact</p>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-800">Soto Dev LLC</p>
              <p>
                For licensing inquiries, permissions, or commercial use requests:{' '}
                <a className="underline underline-offset-2 hover:text-gray-900" href="mailto:jsoto7087@gmail.com">
                  jsoto7087@gmail.com
                </a>
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Café Nelo</p>
              <p>
                For branding and trademark inquiries related to the Café Nelo name and assets:{' '}
                <a className="underline underline-offset-2 hover:text-gray-900" href="mailto:hello@cafenelo.com">
                  hello@cafenelo.com
                </a>
              </p>
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-400">
          All rights not expressly granted in this license are reserved by Soto Dev LLC.
        </p>
      </div>
    </main>
  );
}
