import React from 'react';
import { useMenteeMaterials, buildPreviewUrl, useDeleteMaterial } from '../../hooks/useMaterials';

const MaterialsLibrary: React.FC = () => {
    const { data, isLoading, isError } = useMenteeMaterials();
    const deleteMutation = useDeleteMaterial();

    if (isLoading) {
        return (
            <div className="tw-flex tw-justify-center tw-items-center tw-p-8">
                <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-blue-500" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center">
                    <span className="tw-text-red-600 tw-mr-2">⚠️</span>
                    <span className="tw-text-red-800">Unable to load materials.</span>
                </div>
            </div>
        );
    }

    if (!data || !data.length) {
        return <div className="tw-text-center tw-py-8 tw-text-gray-500">No materials available.</div>;
    }

    return (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-space-y-3">
            {data.map((material) => (
                <div
                    key={material.id}
                    className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-100 tw-rounded-md"
                >
                    <div className="tw-flex tw-flex-col">
                        <span className="tw-text-sm tw-font-medium tw-text-gray-900">{material.title}</span>
                        <span className="tw-text-xs tw-text-gray-500">{material.mimeType}</span>
                    </div>
                    <div className="tw-flex tw-items-center tw-space-x-2">
                        <a
                            href={buildPreviewUrl(material.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-800"
                        >
                            Preview
                        </a>
                        {material.googleDriveDownloadLink && (
                            <a
                                href={material.googleDriveDownloadLink}
                                target="_blank"
                                rel="noreferrer"
                                className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-800"
                            >
                                Download
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => deleteMutation.mutate(material.id)}
                            className="tw-text-xs tw-text-red-600 hover:tw-text-red-800"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default React.memo(MaterialsLibrary);
